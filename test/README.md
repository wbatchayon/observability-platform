# Test du projet sur Proxmox

Provisionne un cluster de test (1 control-plane + 2 workers) sur ton Proxmox
(`https://100.127.112.10:8006/`) puis déploie/valide la plateforme.

> Ce dossier **ne se connecte pas tout seul** à ton Proxmox : tu fournis tes identifiants.

## 0. Prérequis (une fois, sur le nœud Proxmox)

### a. Jeton d'API Proxmox
Datacenter → Permissions → API Tokens → Add. Récupère `user@pam!tokenid=uuid` et donne au compte
le rôle `PVEVMAdmin` (+ accès aux datastores et au pont réseau).

### b. Template cloud-init Ubuntu 22.04 (VM ID 9000)
```bash
cd /var/lib/vz/template/iso
wget https://cloud-images.ubuntu.com/jammy/current/jammy-server-cloudimg-amd64.img
qm create 9000 --name ubuntu-2204-cloud --memory 2048 --cores 2 --net0 virtio,bridge=vmbr0
qm importdisk 9000 jammy-server-cloudimg-amd64.img local-lvm
qm set 9000 --scsihw virtio-scsi-pci --scsi0 local-lvm:vm-9000-disk-0
qm set 9000 --ide2 local-lvm:cloudinit --boot c --bootdisk scsi0 --serial0 socket --vga serial0
qm set 9000 --agent enabled=1
qm template 9000
```
Le datastore `local` doit autoriser le type **Snippets** (Datacenter → Storage → local → Content).

## 1. Provisionner les VMs

```bash
cd test/proxmox
cp terraform.tfvars.example terraform.tfvars   # adapter node, datastore, bridge, IP, clé SSH
export PROXMOX_VE_API_TOKEN="user@pam!tokenid=uuid"
terraform init
terraform apply
terraform output            # récupère les IPs des nœuds
```
Le cloud-init installe automatiquement containerd + kubeadm/kubelet/kubectl sur chaque VM.

## 2. Vérifier l'accès SSH

```bash
ssh ubuntu@100.127.112.21 'kubeadm version && containerd --version'
```

## 3a. Test « smoke » : provisionner le cluster Kubernetes

Les IPs par défaut sont déjà dans `environments/test/00-cluster.tfvars` (ajuste si besoin).

```bash
cd ../..                         # racine du repo
terraform -chdir=bootstrap/00-cluster init
terraform -chdir=bootstrap/00-cluster apply -var-file="$PWD/environments/test/00-cluster.tfvars"
export KUBECONFIG=bootstrap/00-cluster/modules/kubeadm/kubeconfig-observability-test
kubectl get nodes -o wide        # les 3 nœuds doivent être Ready
```

## 3b. Test complet : plateforme d'observabilité

La plateforme tire ses charts/images depuis **Harbor** (conception air-gap). Pour un test complet :

1. Déployer Harbor et **seeder** charts + images (cf. `docs/how-it-works/air-gap.md`), ou pointer
   `HARBOR_REGISTRY` vers un registre/miroir accessible et y importer les charts OCI.
2. Renseigner les secrets : `environments/test/secrets.sops.yaml` puis `make encrypt ENV=test`.
3. Lancer la chaîne :
   ```bash
   make bootstrap ENV=test     # cluster -> Harbor -> Vault -> Flux
   make deploy ENV=test        # FluxCD réconcilie la plateforme
   ```
4. Suivi : `flux get kustomizations` puis `kubectl get pods -A`.

> Astuce test rapide sans tout l'air-gap : valider la configuration sans déployer
> avec `make validate ENV=test`.

## 4. Nettoyage

```bash
cd test/proxmox && terraform destroy
```

## Notes

- Ressources par défaut : cp 2 vCPU/4 Go, workers 4 vCPU/8 Go, disques 40–60 Go (ajustables dans
  `terraform.tfvars`).
- Réseau : adapter `gateway`, `netmask` et les IPs à ton sous-réseau Proxmox.
- En contexte air-gap réel, mettre `registry_mirror` (Harbor) dans `environments/test/00-cluster.tfvars`
  et faire tirer les paquets/k8s depuis le miroir interne.
