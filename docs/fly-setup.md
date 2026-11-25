# Fly.io / Sprites setup (quinn-stoffer)

CoachOps runs its agent on a Sprite in the **quinn-stoffer** organization and uses official Sprites Connectors so provider credentials never enter project code.

## 1. Authenticate

```bash
# Machines CLI (optional for this project)
fly auth login
fly orgs list

# Sprites CLI (required)
sprite login
sprite org list
```

Use org `quinn-stoffer` for all Sprite commands (`-o quinn-stoffer`).

## 2. Create the Sprite

```bash
./scripts/sprite-setup.sh
# or:
sprite create --skip-console -o quinn-stoffer coachops
sprite use -o quinn-stoffer coachops
```

## 3. Connectors (dashboard)

In [Fly dashboard](https://fly.io/dashboard) → **quinn-stoffer** → **Connectors**:

1. **OpenRouter** — enable managed or BYOK; grant access to Sprites with name prefix `coachops`.
2. **Resend** — add with your Resend API key; grant the same Sprite access; restrict to email send paths if available.

Copy each connection id into Sprite environment (not into git):

```bash
sprite exec -o quinn-stoffer -s coachops -- bash -lc \
  'echo export COACHOPS_OPENROUTER_CONNECTION_ID=conn_xxx >> ~/.coachops.env'
```

Or set via your preferred Sprite secret mechanism. The agent only stores **connection ids**.

## 4. Deploy agent code

```bash
./scripts/sprite-deploy.sh
```

Verify:

```bash
sprite exec -o quinn-stoffer -s coachops -- curl -s localhost:8080/ready
```

Gateway calls from outside a Sprite will not authenticate; readiness still reports configuration.

## 5. Local dashboard

The trainer UI stays local (Hacksgiving non-goal: no public dashboard hosting):

```bash
npm run dev:agent      # :8080
npm run dev:dashboard  # :5173 proxies /api → agent
```

Point `VITE_AGENT_URL` at the Sprite HTTPS URL only if you intentionally want the local UI to drive the remote agent (Sprite URL auth may require a token).
