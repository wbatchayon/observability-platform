# ingress - HAProxy + terminaison TLS

Points d'entrée de la plateforme : ingestion OTLP/gRPC (pour les edge/agents) et UI Grafana
(HTTPS).

## Produit (points d'entrée publics)

| Entrée | Domaine | Backend |
|---|---|---|
| OTLP/gRPC | `${OTLP_DOMAIN}` | `otel-gateway` (ns ingestion) :4317 |
| Grafana | `${GRAFANA_DOMAIN}` | `grafana` (ns visualization) :443 |

## Consomme

- `ClusterIssuer` `vault-issuer` → certificats `otlp-ingress-tls`, `grafana-tls`.
- `environments/<env>/ingress.values.yaml` : `OTLP_DOMAIN`, `GRAFANA_DOMAIN`, VIP.

## Caractéristiques

- 2 instances HAProxy **active/active** (anti-affinité), **least-connections**.
- Terminaison **TLS 1.3** + HSTS, redirection HTTPS.
- gRPC : HTTP/2, timeout 30s, **3 retries** + redispatch.
