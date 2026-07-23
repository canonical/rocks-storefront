<script lang="ts">
  import { Heading } from "../Heading";
  import "./styles.css";

  type Props = {
    title: string;
  };

  const { title }: Props = $props();
</script>

<div class="ds search-suggestions">
    <Heading level={2}>{title}</Heading>

    <div class="options">
        You can:
        <ul>
            <!-- TODO: add the correct href -->
            <li><a href="/">Contact us</a> to add a rock to our portfolio.</li>
            <li>Modify the filters applied to widen your search.</li>
            <li>Explore our categories to find alternatives.</li>
        </ul>
    </div>
</div>
