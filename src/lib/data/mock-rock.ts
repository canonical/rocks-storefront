import type { Rock } from "./types";

export const prometheusRock: Rock = {
  name: "Prometheus",
  slug: "prometheus",
  iconUrl: "https://prometheus.io/assets/prometheus_logo_grey.svg",
  publisher: { name: "Canonical", verified: true },
  category: "Observability",
  publishedAt: "2026-06-29T00:00:00.000Z",
  quickPull: {
    latestTag: "latest",
    learnMoreHref: "https://documentation.ubuntu.com/rockcraft/",
  },
  securityCompliance: ["FIPS"],
  sourceCode: [
    {
      label: "Upstream source",
      url: "https://github.com/prometheus/prometheus",
      icon: "github",
    },
    {
      label: "Rock source",
      url: "https://github.com/canonical/prometheus-rock",
      icon: "terminal",
    },
    {
      label: "rockcraft.yaml",
      url: "https://github.com/canonical/prometheus-rock/blob/main/rockcraft.yaml",
      icon: "file",
    },
  ],
  architectures: ["AMD64", "ARM64", "S390X"],
  bases: ["24.04", "22.04", "20.04"],
  license: "MIT",
  contacts: [
    { label: "lucabello", url: "https://github.com/lucabello", icon: "github" },
    { label: "simskij", url: "https://github.com/simskij", icon: "github" },
    {
      label: "Submit a bug",
      url: "https://bugs.launchpad.net/ubuntu-docker-images/+filebug",
      icon: "bug",
    },
  ],
  discussionHref: "https://discourse.ubuntu.com/",
  descriptionHtml: `
    <h2>Description</h2>
    <h3>About Prometheus</h3>
    <p>Prometheus is a systems and service monitoring system.</p>
    <p>Read more on the <a href="https://prometheus.io/">Prometheus website</a>.</p>
    <h3>About Canonical rocks</h3>
    <p>Rocks are minimal, secure, and reliable OCI-compliant images, sliced down to only essential runtime dependencies for a smaller footprint and reduced attack surface. Rocks follow a dependable cadence with LTS and automated security updates, ensuring access to the latest upstream changes while keeping security and compliance front and center.</p>
    <p>Canonical rocks are hardened by default and reviewed to keep them secure.</p>
    <h3>Commercial use and Ubuntu Pro channels</h3>
    <p>If you are an individual developer or a community member, you can access all previous and latest versions using a <a href="https://ubuntu.com/pro">free Ubuntu Pro subscription</a>.</p>
    <p>If your usage includes commercial redistribution, requires security maintenance or support, or needs access to features like FIPS compliance, you need a paid <a href="https://ubuntu.com/pro">Ubuntu Pro subscription</a>. You can <a href="https://ubuntu.com/pro">try it for free for 30 days</a>, or <a href="https://ubuntu.com/pro/subscribe">check our pricing</a> for more details.</p>
    <p><a href="https://ubuntu.com/contact-us">Get in touch</a> to request additional versions, architectures, or features.</p>
  `,
  documentationHtml: `
    <h2>Documentation</h2>
    <h3>Usage</h3>
    <p>Launch this image locally:</p>
    <pre><code>docker run -d --name prometheus-container -e TZ=UTC -p 9090:9090 ubuntu/prometheus:2-24.04_stable</code></pre>
    <p>Access your Prometheus instance at http://localhost:9090.</p>
    <h3>Testing/Debugging</h3>
    <p>To debug the container:</p>
    <pre><code>docker logs -f prometheus-container</code></pre>
    <p>To get an interactive shell:</p>
    <pre><code>docker exec -it prometheus-container /bin/bash</code></pre>
    <h3>Bugs and feature requests</h3>
    <p>If you find a bug in our image or want to request a specific feature, please file a bug here: <a href="https://bugs.launchpad.net/ubuntu-docker-images/+filebug">https://bugs.launchpad.net/ubuntu-docker-images/+filebug</a></p>
    <p>Please title the bug "prometheus: &lt;issue summary&gt;".</p>
    <p>Make sure to include the digest of the image you are using, from:</p>
    <pre><code>docker images --no-trunc --quiet ubuntu/prometheus:&lt;tag&gt;</code></pre>
  `,
  feedbackHref: "https://ubuntu.com/survey",
};
