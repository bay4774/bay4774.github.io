"""Six-direction lecture examples, standard-library-only numerical checks.

Run: python direction_audit_examples.py
All inputs are synthetic. Passing these checks is not a proof of the
general claims, a model-training result, or a hardware validation.
Stable source URLs are /notes/<slug>/ on the teaching site.
"""
import json
import math

results = []


def close(actual, expected, tol=1e-9):
    if not math.isfinite(actual) or not math.isclose(
        actual, expected, rel_tol=tol, abs_tol=tol
    ):
        raise AssertionError((actual, expected))


def check(name, values):
    results.append({"example": name, "status": "pass", "values": values})


# llm-13-training-numerics: unequal valid-token counts.
loss = (2 * 1 + 6 * 3) / 8
close(loss, 2.5)
close(-0.1 * loss, -0.25)
m, v = 0.1 * 2, 0.01 * 2**2
adam = 1 - 0.1 * (m / 0.1) / math.sqrt(v / 0.01)
close(adam, 0.9)
clipped = [x * 2 / math.hypot(3, 4) for x in (3, 4)]
close(math.hypot(*clipped), 2)
check("L06 token weighting, Adam, norm clipping",
      [loss, adam, clipped, 2 * 4 * 128**2 * 4 / 1024**2])

# llm-14-multimodal-interface: shape and attention anchors.
patches, patch_width = (8 // 4)**2, 4 * 4 * 3
if (patches, patch_width, patch_width * 6, 6 * 4) != (4, 48, 288, 24):
    raise AssertionError("patch dimensions")
weights = [math.exp(math.log(3)) / 4, 1 / 4]
close(weights[0], 0.75)
check("L10 patch projection and cross-attention", [patches, patch_width, 0.75, 0.5])

# llm-11-preference-learning: constrained optimum and loss derivative.
ref, reward = [0.5, 0.5], [math.log(3), 0]
z = sum(p * math.exp(r) for p, r in zip(ref, reward))
policy = [p * math.exp(r) / z for p, r in zip(ref, reward)]
for actual, expected in zip(policy, [0.75, 0.25]):
    close(actual, expected)
for p, p_ref, r in zip(policy, ref, reward):
    close(math.log(p / p_ref) + math.log(z), r)
delta = math.log(2.25)
epsilon = 1e-6
dpo_loss = lambda d: math.log1p(math.exp(-d))
close((dpo_loss(delta + epsilon) - dpo_loss(delta - epsilon)) / (2 * epsilon),
      -4 / 13, 1e-8)
check("L11 KL optimum and DPO finite-difference derivative", [policy, dpo_loss(delta)])

# embodied-13-model-planning: stationary equations and feasible active bound.
def objective(u0, u1):
    return u0**2 + u1**2 + (1 + u0 + u1)**2

u0 = u1 = -1 / 3
close(2 * u0 + 2 * (1 + u0 + u1), 0)
close(2 * u1 + 2 * (1 + u0 + u1), 0)
close(objective(u0, u1), 1 / 3)
bounded = objective(-0.2, -0.2)
close(bounded, 0.44)
# Exhaustive feasible grid provides an independent bounded comparison.
grid = [-0.2 + i * 0.01 for i in range(41)]
close(min(objective(a, b) for a in grid for b in grid), bounded)
close(5 / 6 - 5 / 18, 5 / 9)
close(5 / 6 - 5 / 12, 5 / 12)
check("E05 horizon optimum, bounds and replan", [1 / 3, bounded, 5 / 9, 5 / 12])

# embodied-04-state-estimation and embodied-08-evaluation.
y, variance = 0.1, 0.01
odds = (-(y - 1)**2 + (y + 1)**2) / (2 * variance)
close(odds, 20)
discrete_mean = 2 / (1 + math.exp(-odds)) - 1
gaussian_mean = y / 1.01
if discrete_mean - gaussian_mean <= 0.8:
    raise AssertionError("prior-shape counterexample")
prior, noise = 4, 1
gain = prior / (prior + noise)
close((1 - gain)**2 * prior + gain**2 * noise, (1 - gain) * prior)
check("E04/E14 posterior approximation and Joseph covariance",
      [discrete_mean, gaussian_mean, 0.8])

# embodied-14-deployment: coordinate scale and one-step-delay roots.
close(0.01 + 0.02 * (-0.5), 0)
angle = math.pi / 2
close(0.01 * math.cos(angle), 0)
close(0.01 * math.sin(angle), 0.01)
hk = 1.2
if not (abs(1 - hk) < 1 < math.sqrt(hk)):
    raise AssertionError("delay stability counterexample")
check("E13 action units and delayed feedback", [0.01, -0.2, math.sqrt(hk)])

# embodied-11-reward-exploration: waiting reward actually changes the optimum.
close(0.05 / (1 - 0.9), 0.5)
close(0.2 / (1 - 0.9), 2)
if not (0.5 < 0.9**2 < 1 < 2):
    raise AssertionError("reward comparison")
check("E10 waiting-reward contrast", [0.5, 0.81, 2])

# robotics-11-binocular-gaze: inverse geometry and sensitivity.
b, depth = 0.06, 0.3
convergence = 2 * math.atan(b / (2 * depth))
depth_from_angle = lambda nu: b / (2 * math.tan(nu / 2))
close(depth_from_angle(convergence), depth)
sensitivity = -(b / 4) / math.sin(convergence / 2)**2
close(sensitivity, -1.515)
close((depth_from_angle(convergence + epsilon) -
       depth_from_angle(convergence - epsilon)) / (2 * epsilon),
      sensitivity, 1e-7)
close(0.45 + 0.15, 0.6)
close(2 * 0.45 - 6 * 0.15, 0)
check("R04 binocular convergence and head-eye allocation",
      [convergence, sensitivity, [0.45, 0.15]])

# robotics-04-actuation-transmission: current limiting needs changed voltage.
current, resistance, back_emf = 2, 2, 0
voltage = resistance * current + back_emf
close(voltage, 4)
close(voltage * current, resistance * current**2)
check("R05 current limit and power balance", [voltage, 8])

# robotics-06-feedback-control: exact held-torque map vs numerical quadrature.
inertia, damping, h, torque = 0.02, 0.02, 0.01, -0.05
a = math.exp(-damping * h / inertia)
velocity = (1 - a) * torque / damping
position = 0.1 + (h / damping - inertia * (1 - a) / damping**2) * torque
n = 10000
vel = lambda t: torque / damping * (1 - math.exp(-damping * t / inertia))
integral = h / n * (0.5 * vel(0) + sum(vel(i*h/n) for i in range(1, n))
                    + 0.5 * vel(h))
close(position, 0.1 + integral, 1e-10)
close(velocity, -0.0248754156270797)
check("R07 exact zero-order hold", [position, velocity])

# robotics-12-visual-speech: conditioned blend and actuator mapping.
shape = [(3 * 0.2 + 0.8) / 4, (3 * 0 + 0.6) / 4]
joints = [0.2 * shape[0], 0.05 * shape[0] + 0.1 * shape[1]]
close(joints[0], 0.07)
close(joints[1], 0.0325)
if joints[1] <= 0.03:
    raise AssertionError("coupled limit should be violated")
close(10 + 1 + 0.03 - 0.07, 10.96)
check("R10 coarticulation mapping and synchronization", [shape, joints, 10.96])

# physics-09-lagrangian-dynamics: coupled mass matrix at rest.
xdd, tdd = 1, -1
close(2 * xdd + tdd, 1)
close(xdd + tdd, 0)
check("P03 cart-pendulum coupled acceleration", [xdd, tdd])

# physics-13-inequality-kkt: stationarity, feasibility and complementary slackness.
for center in (-1, 0.5, 2):
    for bound in (0, 1):
        x = min(center, bound)
        multiplier = max(center - bound, 0)
        close(x - center + multiplier, 0)
        close(multiplier * (bound - x), 0)
        if multiplier < 0 or x > bound:
            raise AssertionError("KKT feasibility")
check("P09 six active/inactive KKT cases", [6])

# physics-07-physics-informed-learning: exact zero residual at training nodes.
amplitude = 16
f = lambda t: math.exp(-t) + amplitude * t**2 * (t - 1)**2
df = lambda t: -math.exp(-t) + amplitude * (2*t*(t-1)**2 + 2*t*t*(t-1))
for t in (0, 1):
    close(f(t) + df(t), 0)
close(f(0), 1)
close(f(0.5) - math.exp(-0.5), 1)
check("P11 sampled-residual counterexample", [0, 0, 1])

# physics-14-spatial-boundaries: heat equation one step and grid convergence.
def heat_error(cells):
    dx, r, final_time = 1 / cells, 0.25, 1 / 16
    dt = r * dx * dx
    steps = round(final_time / dt)
    close(steps * dt, final_time)
    u = [math.sin(math.pi * j / cells) for j in range(cells + 1)]
    u[0] = u[-1] = 0
    for _ in range(steps):
        u = [0] + [r*u[j-1] + (1-2*r)*u[j] + r*u[j+1]
                   for j in range(1, cells)] + [0]
    return max(abs(u[j] - math.exp(-math.pi**2*final_time) *
                   math.sin(math.pi*j/cells)) for j in range(cells + 1))

close(0.25 * math.sqrt(2)/2 + 0.5 + 0.25 * math.sqrt(2)/2,
      0.8535533905932737)
errors = [heat_error(n) for n in (4, 8, 16)]
if not (errors[0] > errors[1] > errors[2] > 0):
    raise AssertionError(errors)
check("P12 explicit heat equation and refinement", errors)

# physics-12-differentiable-simulation: initial-state parameter path.
one_step = lambda theta: (1 - 0.1 * theta) * theta
close((one_step(1 + epsilon) - one_step(1 - epsilon)) / (2 * epsilon), 0.8, 1e-8)
close(0.9 - 0.1, 0.8)
check("P13 initial-state adjoint term", [0.9, -0.1, 0.8])

# agent-13-model-runtime and agent-03-planning-search.
close(0.9 * 0.8 * 0.95 * 0.9, 0.6156)
nodes = [(6, 1), (1, 4)]
if min(range(2), key=lambda i: nodes[i][1]) == min(range(2), key=lambda i: sum(nodes[i])):
    raise AssertionError("greedy and A-star should differ")
check("T05/T09 search and conditional success probability", [7, 5, 0.6156])

# gesture-09-speech-features: explicit complex DFT.
sample = [1, -1, 0, 0]
real = sum(v * math.cos(2*math.pi*r/4) for r, v in enumerate(sample))
imag = sum(-v * math.sin(2*math.pi*r/4) for r, v in enumerate(sample))
close(real, 1)
close(imag, 1)
check("G02 DFT real/imaginary projections", [real, imag, math.hypot(real, imag)])

# gesture-03-motion-processing: SLERP and aliasing.
omega, s = math.pi / 4, 0.5
q0, q1 = [1, 0, 0, 0], [math.sqrt(0.5), 0, 0, math.sqrt(0.5)]
qm = [(math.sin((1-s)*omega)*a + math.sin(s*omega)*b)/math.sin(omega)
      for a, b in zip(q0, q1)]
close(sum(x*x for x in qm), 1)
close(2 * math.atan2(qm[3], qm[0]), math.pi / 4)
for n in range(30):
    close(math.cos(2*math.pi*20*n/30), math.cos(2*math.pi*10*n/30))
check("G04 rotation midpoint and downsampling alias", qm)

# gesture-12-temporal-modeling: causal convolution and carried recurrence.
sequence = [1, 2, 4, 0]
convolution = [sum(w * sequence[t-j] for j, w in enumerate([0.5, 0.3, 0.2])
                   if t >= j) for t in range(4)]
for actual, expected in zip(convolution, [0.5, 1.3, 2.8, 1.6]):
    close(actual, expected)
state, recurrent = 0, []
for x in sequence:
    state = 0.5 * state + x
    recurrent.append(state)
close(recurrent[-1], 2.625)
check("G06 time convolution and recurrent state", [convolution, recurrent, 7])

# gesture-10-latent-variables and gesture-05-generative-models.
kl = 0.5 * (1 + 0.25 - 1 - math.log(0.25))
close(kl, 0.8181471805599453)
posterior_variance = 1 / (0.8 / 0.2 + 1 / 0.2)
close(posterior_variance, 1/9)
mean_noise = (0.5 - 0.2 * (-0.4) / 0.6) / math.sqrt(0.8)
x0hat = (0.5 + 0.24) / 0.8
mean_posterior = (math.sqrt(0.8)*0.2/0.36*x0hat +
                  math.sqrt(0.8)*0.2/0.36*0.5)
close(mean_noise, mean_posterior)
check("G07/G08 Gaussian KL and DDPM posterior", [kl, posterior_variance, mean_noise])

# gesture-13-streaming-generation: analytic Hermite limits and finite differences.
duration, displacement = 0.5, 0.1
position_at = lambda t: displacement * (3*(t/duration)**2 - 2*(t/duration)**3)
velocity_at = lambda t: displacement / duration * (6*t/duration - 6*(t/duration)**2)
close(position_at(duration/2), 0.05)
close(velocity_at(duration/2), 0.3)
close((position_at(duration/2 + epsilon) - position_at(duration/2 - epsilon)) /
      (2 * epsilon), 0.3, 1e-8)
close(displacement / duration**2 * 6, 2.4)
minimum_time = max(1.5 * displacement / 0.2, math.sqrt(6*displacement))
close(minimum_time, math.sqrt(0.6))
check("G11 streaming latency and Hermite limits", [175, 0.05, 0.3, 2.4, minimum_time])

# gesture-08-evaluation and gesture-11-human-evaluation.
close((1 - 0.5)**2 + (2 - 1)**2, 1.25)
correct_variance = 1/4 + 0.25/5 + 1/(4*5)
naive_variance = (1 + 0.25 + 1)/(4*5)
close(correct_variance, 0.35)
close(naive_variance, 0.1125)
check("G12/G13 Gaussian distance and crossed-rating uncertainty",
      [1.25, math.sqrt(correct_variance), math.sqrt(naive_variance)])

print(json.dumps({"groups_passed": len(results), "results": results},
                 ensure_ascii=False, indent=2))
