# The Charm for the rocks-storefront website

This charm was created using the [PaaS App Charmer](https://juju.is/docs/sdk/paas-charm)

## Local development

To develop locally you can follow the steps in the `terraform/local-ps7/README.md` file to set-up a local PS7 like
environment. Inside the created Multipass VM you'll have all the needed tools to create and test rocks and charms.

## Local development (legacy)

To work on this charm locally, you first need to set up an environment, follow [this section](https://juju.is/docs/sdk/write-your-first-kubernetes-charm-for-a-flask-app#heading--set-things-up) of the tutorial.

Then, you can run the following command to pack and upload the rock:

```bash
rockcraft pack
rockcraft.skopeo --insecure-policy copy --dest-tls-verify=false oci-archive:rocks-storefront*.rock docker://localhost:32000/rocks-storefront:1.0
```

This will pack the application into a [rock](https://documentation.ubuntu.com/rockcraft/en/latest/explanation/rocks/) (OCI image) and upload it to the local registry.

You can deploy the charm locally with:

```bash
cd charm
charmcraft fetch-libs
charmcraft pack
juju deploy ./*.charm --resource app-image=localhost:32000/rocks-storefront:1.0
```

This will deploy the charm with the rock image you just uploaded attached as a resource.

once `juju status` reports the charm as `active`, you can test the webserver:

```bash
curl {IP_OF_ROCKS_STOREFRONT_UNIT}:8000
```

to connect using a browser, the easiest way is to integrate with `nginx-ingress-integrator`:

```bash
juju deploy nginx-ingress-integrator --trust
juju config nginx-ingress-integrator service-hostname=rockstore.local path-routes=/
juju integrate nginx-ingress-integrator rocks-storefront
```

You can then add `rockstore.local` to your `/etc/hosts` file with the IP of the multipass vm:

```bash
multipass ls # Get the IP of the VM
echo "{IP_OF_VM} rockstore.local" | sudo tee -a /etc/hosts
```

> Note: login will not work using this setup, if you'd like to access publisher pages, change the domain to `staging.rocks.ubuntu.com`, but make sure to remove the line from `/etc/hosts/` after you're done.
