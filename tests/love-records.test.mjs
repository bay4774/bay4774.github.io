import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLoveRecord, validateRecordDate, customAnniversaries, customDatesInMonth, shanghaiToday } from '../src/lib/love-records.mjs';

test('records validate lengths, real dates, required body and strip extra fields', () => {
  const source = { title:' A day ', date:'2024-02-29', body:' Hello ', author:' A ', secret:'omit' };
  assert.deepEqual(validateLoveRecord('diary',source), {title:'A day',date:'2024-02-29',body:'Hello',author:'A'});
  for (const date of ['2023-02-29','2024-04-31','0000-01-01','2024-1-01','2024-01-01T00:00:00Z']) assert.throws(()=>validateRecordDate(date));
  assert.throws(()=>validateLoveRecord('diary',{...source,body:' '}));
  assert.throws(()=>validateLoveRecord('diary',{...source,body:'x'.repeat(12001)}));
  assert.throws(()=>validateLoveRecord('diary',{...source,title:'x'.repeat(81)}));
  assert.throws(()=>validateLoveRecord('note',source));
  assert.throws(()=>validateLoveRecord('anniversary',{title:'Sample',date:'2024-01-01',repeat:'weekly'}));
});
test('photo content must contain bounded canonical WebP data', () => {
  const photo = {title:'Photo',caption:'',category:'couple',mime:'image/webp',data:Buffer.from('RIFF1234WEBPcontent').toString('base64'),width:1200,height:900};
  assert.equal(validateLoveRecord('photo',photo).category,'couple');
  for(const patch of [{mime:'image/svg+xml'},{data:Buffer.from('not a photo').toString('base64')},{data:'abcd=xyz'},{width:1601},{category:'unknown'},{date:'2023-02-29'}]) assert.throws(()=>validateLoveRecord('photo',{...photo,...patch}));
});
const entry=(id,date,repeat='yearly')=>({id,type:'anniversary',value:{title:'A date',date,repeat,note:''}});
test('custom countdown respects Shanghai midnight and includes today', () => {
  const records=[entry('annual','2020-05-10'),entry('once','2024-05-10','once'),entry('past','2024-05-09','once')];
  assert.equal(shanghaiToday(new Date('2024-05-09T16:00:00Z')),'2024-05-10');
  assert.deepEqual(customAnniversaries(records,new Date('2024-05-09T16:00:00Z')).map(x=>[x.id,x.daysUntil]),[['annual',0],['once',0]]);
  assert.equal(customAnniversaries(records,new Date('2024-05-10T16:00:00Z'))[0].date,'2025-05-10');
});
test('annual leap day clamps only its occurrence and does not start before original date', () => {
  const records=[entry('leap','2024-02-29')];
  assert.equal(customAnniversaries(records,new Date('2025-02-27T16:00:00Z'))[0].date,'2025-02-28');
  assert.equal(customAnniversaries(records,new Date('2023-01-01T00:00:00Z'))[0].date,'2024-02-29');
  assert.deepEqual(customDatesInMonth(records,2023,2),[]);
  assert.equal(customDatesInMonth(records,2025,2)[0].date,'2025-02-28');
  assert.equal(customDatesInMonth(records,2028,2)[0].date,'2028-02-29');
});
test('calendar retains past one-time records only in their original month', () => {
  const records=[entry('single','2020-03-15','once'),entry('annual','2020-03-16')];
  assert.equal(customDatesInMonth(records,2020,3).length,2);
  assert.deepEqual(customDatesInMonth(records,2021,3).map(x=>x.id),['annual']);
  assert.equal(customDatesInMonth(records,2021,4).length,0);
  assert.throws(()=>customDatesInMonth(records,2021,13));
});
