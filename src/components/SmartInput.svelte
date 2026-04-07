<script lang="ts">
  let { value = $bindable(), options = [], placeholder = "" } = $props();
  
  let showDropdown = $state(false);
  let filteredOptions = $derived(
    options.filter((opt: string) => 
      opt.toLowerCase().includes(value.toLowerCase())
    )
  );

  const selectOption = (opt: string) => {
    value = opt;
    showDropdown = false;
  };

  const handleBlur = () => {
    // Small timeout to allow click on dropdown items
    setTimeout(() => { showDropdown = false; }, 200);
  };
</script>

<div class="smart-input-container">
  <input 
    type="text" 
    {placeholder}
    bind:value={value}
    onfocus={() => showDropdown = true}
    onblur={handleBlur}
    autocomplete="off"
    required
  />
  
  {#if showDropdown && filteredOptions.length > 0}
    <ul class="dropdown">
      {#each filteredOptions as opt}
        <li>
          <button type="button" onclick={() => selectOption(opt)}>
            {opt}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .smart-input-container {
    position: relative;
    width: 100%;
  }

  input {
    width: 100%;
    padding: var(--space-sm) var(--space-md);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-white);
    font-size: 1rem;
    transition: all 0.2s;
  }

  input:focus {
    outline: none;
    border-color: var(--color-cta);
    box-shadow: 0 0 0 4px rgba(255, 122, 0, 0.1);
  }

  .dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    max-height: 200px;
    overflow-y: auto;
    background: var(--color-white);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    z-index: 1001;
    list-style: none;
    padding: 0;
    margin: 4px 0 0 0;
  }

  .dropdown li button {
    width: 100%;
    text-align: left;
    padding: var(--space-sm) var(--space-md);
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.9rem;
    color: var(--color-text);
  }

  .dropdown li button:hover {
    background-color: #fffaf0;
    color: var(--color-cta);
  }
</style>
