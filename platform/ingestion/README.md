# platform/ingestion - OTel Gateway + Edge Collectors

Couche d'ingestion : reçoit la télémétrie, la traite et la route vers les backends.
Distribution **OpenTelemetry Collector contrib v0.148.0** (tirée du dépôt interne Harbor).

## Pipeline du Gateway (x3)

```
receivers(otlp gRPC mTLS 4317 / http 4318)
  -> memory_limiter -> filter -> resource/attributes(enrich) -> [tail_sampling pour traces] -> batch
  -> sending_queue(persistante via file_storage) + retry_on_failure
  -> exporters: loki | prometheusremotewrite(mimir) | otlp(tempo)
```

## Produit

- Service d'ingestion OTLP : **`otel-gateway.ingestion.svc.cluster.local:4317`**
  (exposé à l'extérieur par `ingress/`, consommé par les agents/edge des VMs).

## Consomme (backends, platform/backends)

- Loki : `http://loki-gateway.backends.svc.cluster.local/loki/api/v1/push`
- Mimir : `http://mimir-distributor.backends.svc.cluster.local/api/v1/push`
- Tempo : `tempo-distributor.backends.svc.cluster.local:4317`
- `ClusterIssuer` `vault-issuer` (mTLS).

## Edge Collector

Déployé par DC : reçoit l'OTLP des agents, applique un filtre préliminaire, buffer persistant et
**compression gzip**, puis exporte en OTLP/gRPC mTLS vers le gateway.

## Variables (`environments/<env>/ingestion.values.yaml`)

`OTEL_GATEWAY_REPLICAS`, `OTEL_EDGE_REPLICAS`, `TRACE_SAMPLING_PERCENT`, `TENANT_ID`,
`ENVIRONMENT`.
