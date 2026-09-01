<script lang="ts">
  import { Link } from "@canonical/svelte-ds-app-launchpad";
  import { SmallCaps } from "$lib/components/ui/SmallCaps";
  import { SplitLayout } from "$lib/components/ui/SplitLayout";
  import "./styles.css";

  const SURVEY_HREF = "https://ubuntu.com/";
</script>

<SplitLayout class="rock-feedback">
  {#snippet aside()}
    <SmallCaps>Feedback</SmallCaps>
  {/snippet}
  {#snippet main()}
    <p class="rock-feedback__text">
      Your feedback is important to us! Help us improve your store experience by
      taking <Link href={SURVEY_HREF} target="_blank" rel="noopener">
        this short survey</Link
      >.
    </p>
  {/snippet}
</SplitLayout>
