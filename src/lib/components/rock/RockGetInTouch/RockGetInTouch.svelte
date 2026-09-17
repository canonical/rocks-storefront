<script lang="ts">
  import { Link } from "@canonical/svelte-ds-app-launchpad";
  import { SmallCaps } from "$lib/components/ui/SmallCaps";
  import { SplitLayout } from "$lib/components/ui/SplitLayout";
  import "./styles.css";

  // TODO: add the correct hrefs
  const CONTACT_HREF = "https://ubuntu.com/";
  const SURVEY_HREF = "https://ubuntu.com/";
</script>

<SplitLayout class="rock-get-in-touch">
  {#snippet aside()}
    <SmallCaps>Get in touch</SmallCaps>
  {/snippet}
  {#snippet main()}
    <p class="rock-get-in-touch__text">
      Can’t find the version you are looking for, or the architecture you need?
      <Link href={CONTACT_HREF} target="_blank" rel="noopener">Contact us</Link>
      to get a consultation.
    </p>
    <p class="rock-get-in-touch__text">
      Your feedback is important to us! Help us improve your store experience by
      taking <Link href={SURVEY_HREF} target="_blank" rel="noopener">
        this short survey</Link
      >.
    </p>
  {/snippet}
</SplitLayout>
