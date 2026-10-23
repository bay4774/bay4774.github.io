---
title: 'T09 · 模型怎样进入行动循环：提议、执行与观察'
description: '把语言模型接到受检工具接口，区分模型候选、执行状态和验收证据，用可运行小实验核验协议边界。'
date: '2026-10-17'
tags: ['Agent', 'Direction Foundations']
category: 'lecture'
directionTrack: 'agent'
directionChapter: 9
readTime: 36
chapters: 7
demo: false
draft: false
---

先修：[工具契约](/notes/agent-02-tool-contracts/)、[结构化校验](/notes/agent-09-structured-validation/)、[证据与行动](/notes/agent-05-grounded-reasoning/)。若还不清楚语言模型为何输出不同候选，可借读[解码](/notes/llm-04-decoding/)，无需先完成大模型整条路线。入口自查：合法JSON、参数合法、操作成功和任务完成是否是同一件事？

## 1. 模型负责提出什么

将当前任务目标、工具说明和历史观察编码成上下文，模型产生下一步候选。候选可以是工具调用，也可以是最终回答。执行程序负责解析、校验、调用真实工具、保存结果与检查终止；工具返回再进入下一轮。模型不会因为写出“读取成功”就真的得到文件。

用历史$h_t$表示截至此时的可信状态与可用观察，模型提议$a_t\sim\pi_\theta(\cdot\mid h_t)$；校验器把它映射为合法动作或拒绝；环境产生观察$o_{t+1}$；状态更新器构造$h_{t+1}$。拒绝也应记录为明确的协议反馈，不能悄悄把不合法参数改成另一个高风险动作。

这种观察与行动相接的组织方式可对照[ReAct原始论文](https://arxiv.org/abs/2210.03629)。本章不要求公开模型内部推理，只保留决策所需的依据摘要、动作与工具事实。自然语言计划、结构化调用和环境状态是三个不同对象。

## 2. 一轮上下文怎样组织

上下文至少含四类信息：用户目标与成功条件；允许工具的名称、参数和副作用；已验证状态及剩余预算；带来源、时间与调用标识的外部观察。它们应有明确的类型边界。检索正文里的“更改规则”是来源内容，不能自动写进执行器的允许工具表。

例如目标是“读取A的第2修订，报告其中的数值并注明来源”。读取工具要求文档标识与修订号；观察返回文档标识、实际修订、数值和调用标识；完成提议必须引用同一来源。模型看到的上下文只包含实际得到的记录，不能提前塞入评价器的正确答案。

一个调用标识用于把请求与结果对应。异步返回时应按标识配对，不能按“最后到达的文本”猜测它属于哪个请求。重复、过期或未知标识要单独处理。协议本身也会占用上下文长度，因此摘要必须保留来源、未决操作和预算等会影响行动的事实。

把上下文写得清楚有助于模型决策，但执行边界仍需要程序校验。模型可以受外部文本影响；仅将正文放进引号或提示“忽略指令”不是对任意输入的可靠性证明。

## 3. 为什么要分阶段计数

定义事件$F$为格式合法，$C$为通过工具契约，$E$为执行成功，$V$为最终验收通过。若成功任务要求这四项，则链式法则给出

$$
P(F,C,E,V)=P(F)P(C\mid F)P(E\mid F,C)P(V\mid F,C,E).
$$

这不假设独立。假设四个条件概率分别为$0.9,0.8,0.95,0.9$，端到端概率为$0.6156$。不能将全部调用的格式率与“仅成功任务”的执行率混在一起相乘，因为它们对应的条件集合不同。

同理，模型输出正确JSON却调用错文档，是决策或语义错误；参数正确但服务超时，是执行状态未明；工具读到A却回答B，是证据使用错误。分层记录才能知道应修提示、数据、校验器还是恢复逻辑。多个调用属于同一任务时，还不能把它们当独立任务扩大样本数。

## 4. 可运行的模型接口替身

下面仅依赖Python标准库。传入的字符串序列替代模型输出，执行器并不知道后续会收到什么。它测试接口与验收边界；没有训练或调用真实语言模型，也不测量模型理解能力。工具只读合成内存数据。为了便于逐行看清，读取与执行是同步的，来源快照在整轮任务中不变。

~~~python
import json

DOCS = {"A": {"revision": 2, "value": 7}}

def run(proposals):
    seen, evidence, trace = set(), {}, []
    for raw in proposals[:6]:
        try:
            p = json.loads(raw)
            if type(p) is not dict or set(p) != {"id", "tool", "args"}:
                raise ValueError("envelope")
            cid, tool, args = p["id"], p["tool"], p["args"]
            if type(cid) is not str or not cid or cid in seen:
                raise ValueError("call_id")
            seen.add(cid)
            if type(tool) is not str or type(args) is not dict:
                raise ValueError("types")
            if tool == "read":
                if set(args) != {"doc_id", "revision"}:
                    raise ValueError("read_fields")
                did, rev = args["doc_id"], args["revision"]
                if type(did) is not str or type(rev) is not int:
                    raise ValueError("read_types")
                if did not in DOCS or DOCS[did]["revision"] != rev:
                    raise ValueError("source_mismatch")
                observation = dict(call_id=cid, source_id=did,
                                   source_revision=rev,
                                   value=DOCS[did]["value"])
                evidence[did] = observation
                trace.append(("observation", observation))
            elif tool == "finish":
                if set(args) != {"value", "source_id", "source_revision"}:
                    raise ValueError("finish_fields")
                if (type(args["value"]) is not int
                    or type(args["source_id"]) is not str
                    or type(args["source_revision"]) is not int):
                    raise ValueError("finish_types")
                obs = evidence.get(args["source_id"])
                if obs is None or any(args[k] != obs[k] for k in args):
                    raise ValueError("unverified_finish")
                trace.append(("verified_finish", args))
                return {"status": "verified", "result": args, "trace": trace}
            else:
                raise ValueError("tool_not_allowed")
        except (ValueError, TypeError) as error:
            trace.append(("rejected", str(error)))
    return {"status": "incomplete", "result": None, "trace": trace}

def proposal(cid, tool, args):
    return json.dumps(dict(id=cid, tool=tool, args=args))

read = proposal("r1", "read", dict(doc_id="A", revision=2))
finish = proposal("f1", "finish",
                  dict(value=7, source_id="A", source_revision=2))
cases = {
    "normal": [read, finish],
    "bad_json": ["{", read, finish],
    "wrong_tool": [proposal("x", "delete", {}), read, finish],
    "early_finish": [finish],
    "bool_revision": [proposal("b", "read", dict(doc_id="A", revision=True))],
    "wrong_source": [proposal("w", "read", dict(doc_id="B", revision=2))],
    "wrong_value": [read, proposal("f", "finish",
                                 dict(value=8, source_id="A", source_revision=2))],
    "duplicate_id": [read, read],
}
for name, proposals in cases.items():
    result = run(proposals)
    expected = name in {"normal", "bad_json", "wrong_tool"}
    assert (result["status"] == "verified") == expected
    if expected:
        # 独立评价器固定任务真值；模型输入不能读取这一判据。
        assert result["result"] == dict(value=7, source_id="A", source_revision=2)
    assert DOCS == {"A": {"revision": 2, "value": 7}}
    print(name, result["status"], len(result["trace"]))
~~~

这里用严格类型判断排除Python中作为整数子类的布尔值。调用标识即使因参数不合法被拒绝，也已消耗，修正后应发新标识。预算按尝试计，格式错误同样消耗一次。真正模型适配器每轮只需替换“取得下一个字符串”这一步，并将刚产生的结构化观察送回模型。

## 5. 从替身换成真实模型时补什么

真实适配器应记录模型版本、输入模板、采样设定、输入输出长度、时延和原始候选；不能只保留成功轨迹。截断、拒绝、空输出和解析失败都必须进入状态机。使用支持结构化输出的接口可减少格式错误，但来源错配、越权提议与错误完成仍需另测。

工具执行超时不等于操作失败；这里的只读同步示例不能覆盖写入后的未知状态，需接到[恢复与未决状态](/notes/agent-06-reliability-recovery/)。限制六轮也不限制单次模型或工具调用的等待时间，实际系统还要有调用超时与总截止时间。

冻结工具和评价器后，比较规则控制器与模型控制器；按任务模板隔离开发与测试。先测只读多步任务，再独立引入可恢复写入。不应把规则系统对固定恶意字符串的忽略，写成真实语言模型能抵抗所有提示注入。

## 6. 自测与步骤答案

1. 模型第一轮直接给出正确数值7，为什么本章仍不验收？
2. 第3节四个数相乘是否要求各阶段独立？为什么？
3. 读取成功后生成错误数值8，是工具故障吗？
4. 将工具名称交给Python的动态执行函数是否有必要？

答案1：任务要求读取指定修订并给出证据；正确猜测没有满足观察条件。答案2：不要求，因为每项都是前面事件发生条件下的概率；用无条件边际概率相乘才需要额外独立假设。答案3：本例工具已经返回7，错误发生在提议或证据使用阶段。答案4：没有必要，应从固定工具表选择并校验参数；普通文本不能变成任意代码。

## 7. 可复现实验与出口

先运行八种情况，再增加空调用标识、未知额外字段、六次错误耗尽预算、来源正确但修订错误四种夹具。预先写好应拒绝的阶段，并断言内存数据未被改动。模型实验应另外报告真实模型版本、任务数和完整失败轨迹，不能复用替身实验的成功标签。

出口：能画出“上下文→候选→校验→执行→观察→验收”的完整循环，指出每个字段由谁产生、谁有权修改，并能区分接口实验与模型能力实验。

[上一章](/notes/agent-05-grounded-reasoning/) · [方向目录](/notes/direction-foundations/) · [下一章](/notes/agent-06-reliability-recovery/)
