# Référentiel des packages OpenTelemetry Collector contrib à héberger (air-gap).
# Aligné sur VM_Configuration/Docs/Markdown/specification_packages_otel.md.
# Ces artefacts sont importés offline dans le projet Harbor `otel-packages` puis tirés par les VMs.

locals {
  otel_artifacts = [
    "otelcol-contrib_${var.otel_version}_amd64.deb",
    "otelcol-contrib_${var.otel_version}_arm64.deb",
    "otelcol-contrib-${var.otel_version}.x86_64.rpm",
    "otelcol-contrib-${var.otel_version}.aarch64.rpm",
    "otelcol-contrib_${var.otel_version}_windows_amd64.tar.gz",
    "otelcol-contrib_${var.otel_version}_windows_arm64.tar.gz",
    "otelcol-contrib_${var.otel_version}_linux_amd64.tar.gz",
    "otelcol-contrib_${var.otel_version}_linux_arm64.tar.gz",
    "checksums.txt",
  ]
}

output "expected_otel_artifacts" {
  description = "Liste des artefacts OTel attendus dans le dépôt (vérifiés par checksums.txt + signature GPG)."
  value       = local.otel_artifacts
}
