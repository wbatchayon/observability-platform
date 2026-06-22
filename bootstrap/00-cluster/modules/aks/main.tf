# Module aks : wrappe le module communautaire officiel Azure/aks/azurerm
# avec un set d'inputs minimal. Resource group fourni en entrée.

data "azurerm_resource_group" "this" {
  name = var.resource_group
}

module "aks" {
  source  = "Azure/aks/azurerm"
  version = "~> 9.0"

  resource_group_name = data.azurerm_resource_group.this.name
  location            = var.region
  cluster_name        = var.cluster_name
  prefix              = var.cluster_name
  kubernetes_version  = var.kubernetes_version

  agents_count = var.node_pool_size
  agents_size  = var.node_instance_type
}
