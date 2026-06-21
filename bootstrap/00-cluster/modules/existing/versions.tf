terraform {
  # terraform_data est une ressource intégrée : aucun provider externe requis.
  # Le module valide donc sans credentials cloud (init -backend=false + validate).
  required_version = ">= 1.6.0"
}
