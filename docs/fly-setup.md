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

## 3. Connectors

### OpenRouter (managed)

Provisioned for this org (example already used in Hacksgiving setup):

```bash
cd /tmp  # avoid workspace .sprite path prefixing
sprite api -o quinn-stoffer /v1/oauth/connections/provision -- \
  -X POST -H 'Content-Type: application/json' -d '{"provider":"openrouter"}'
sprite api -o quinn-stoffer /v1/oauth/connections/<id> -- \
  -X PUT -H 'Content-Type: application/json' \
  -d '{"access_policy":{"name_prefix":"coachops"}}'
```

If chat completions return `credits_exhausted`, add prepaid credits at  
https://fly.io/dashboard/quinn-stoffer/sprites/connectors/<id>

Redeploy the service with the connection id:

```bash
COACHOPS_OPENROUTER_CONNECTION_ID=<id> ./scripts/sprite-deploy.sh
```

### Resend (outbound demo email)

In [Fly dashboard](https://fly.io/dashboard) → **quinn-stoffer** → **Connectors**:

1. Add **Resend** with your API key.
2. Grant access to Sprites with name prefix `coachops`.
3. Redeploy with `COACHOPS_RESEND_CONNECTION_ID=<id>`.

The agent only stores **connection ids**, never provider credentials.

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
