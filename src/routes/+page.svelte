<script>
  import '../global.css';
  // Import statements for components will be added here later
  // e.g., import ImageUpload from '$lib/components/ImageUpload.svelte';

  let imageUrl = '';
  let promptText = '';
  let statusMessage = 'Ready to generate.';
  let generatedVideoUrl = '';
  let generatedGifUrl = '';
  let isGenerating = false;

  async function handleGenerate() {
    if (!imageUrl || !promptText) {
      statusMessage = 'Please upload an image and enter a prompt.';
      return;
    }
    isGenerating = true;
    statusMessage = 'Generating Video...';

    // Placeholder for API call
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl, promptText }), // In a real scenario, you'd send FormData for the image
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || 'Failed to generate video.');
      }

      const result = await response.json();
      statusMessage = 'Creating GIF...'; // This would be updated based on actual backend progress
      // Simulate GIF creation delay
      await new Promise(resolve => setTimeout(resolve, 1500)); 

      generatedVideoUrl = result.videoUrl;
      generatedGifUrl = result.gifUrl;
      statusMessage = 'Complete!';
    } catch (error) {
      console.error('Error generating:', error);
      statusMessage = `Error: ${error.message}`;
    } finally {
      isGenerating = false;
    }
  }

  function handleStartOver() {
    imageUrl = '';
    promptText = '';
    generatedVideoUrl = '';
    generatedGifUrl = '';
    statusMessage = 'Ready to generate.';
    isGenerating = false;
    // Reset file input if necessary (requires more direct DOM manipulation or component-specific logic)
  }

  // Placeholder for image upload handling
  function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      // For now, just storing a placeholder. Real upload would involve FormData.
      imageUrl = URL.createObjectURL(file); // This is a local URL, not what's sent to backend directly
      statusMessage = 'Image selected.';
    } else {
      imageUrl = '';
      statusMessage = 'Invalid file type. Please select JPEG or PNG.';
    }
  }

</script>

<svelte:head>
  <title>VideoGenie - Image to Video & GIF</title>
</svelte:head>

<main class="container">
  <header>
    <h1>VideoGenie</h1>
    <p>Transform your images into captivating videos and GIFs with AI.</p>
  </header>

  <section class="controls">
    <div class="input-group">
      <label for="image-upload">1. Upload Image (JPEG/PNG)</label>
      <!-- Basic file input, will be styled/replaced by a component -->
      <input type="file" id="image-upload" class="input-field" accept=".jpg, .jpeg, .png" on:change={handleImageUpload} disabled={isGenerating}>
    </div>

    <div class="input-group">
      <label for="prompt-text">2. Enter Your Creative Prompt</label>
      <textarea id="prompt-text" class="input-field" bind:value={promptText} placeholder="e.g., A futuristic cityscape at sunset" rows="3" disabled={isGenerating}></textarea>
    </div>

    <button class="button-primary generate-button" on:click={handleGenerate} disabled={isGenerating}>
      {#if isGenerating}
        Generating...
      {:else}
        ✨ Generate Video & GIF
      {/if}
    </button>
  </section>

  <section class="status">
    <p><strong>Status:</strong> {statusMessage}</p>
  </section>

  {#if generatedVideoUrl || generatedGifUrl}
    <section class="results">
      <h2>Your Creations</h2>
      <div class="result-items">
        {#if generatedVideoUrl}
          <div class="result-card">
            <h3>Generated Video (MP4)</h3>
            <video controls src={generatedVideoUrl} width="320">
              Your browser does not support the video tag.
            </video>
            <a href={generatedVideoUrl} download="generated_video.mp4" class="button-primary download-button">Download Video</a>
          </div>
        {/if}

        {#if generatedGifUrl}
          <div class="result-card">
            <h3>Generated GIF</h3>
            <img src={generatedGifUrl} alt="Generated GIF" width="320">
            <a href={generatedGifUrl} download="generated_animation.gif" class="button-primary download-button">Download GIF</a>
          </div>
        {/if}
      </div>
    </section>
  {/if}

  {#if generatedVideoUrl || generatedGifUrl || imageUrl || promptText}
    <button class="button-secondary start-over-button" on:click={handleStartOver} disabled={isGenerating}>
      Start Over
    </button>
  {/if}

</main>

<style>
  .container {
    max-width: 800px;
    margin: 2rem auto;
    padding: 2rem;
    text-align: center;
  }

  header h1 {
    font-size: 2.5rem;
    color: var(--primary-accent);
    margin-bottom: 0.5rem;
  }

  header p {
    font-size: 1.1rem;
    color: var(--secondary-text);
    margin-bottom: 2rem;
  }

  .controls, .status, .results {
    margin-bottom: 2rem;
  }

  .input-group {
    margin-bottom: 1.5rem;
    text-align: left;
  }

  .input-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }

  .input-field {
    background-color: var(--secondary-bg);
    border: 1px solid var(--secondary-text);
    border-radius: var(--border-radius-sm);
    padding: 12px;
    color: var(--primary-text);
    width: 100%;
    box-sizing: border-box; /* Ensures padding doesn't add to width */
  }

  .input-field:focus {
    outline: none;
    border-color: var(--primary-accent);
    box-shadow: 0 0 0 2px var(--primary-accent);
  }

  textarea.input-field {
    resize: vertical;
  }

  .button-primary {
    background-color: var(--primary-accent);
    color: var(--primary-text);
    border: none;
    padding: 12px 24px;
    border-radius: var(--border-radius-sm);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    font-size: 1rem;
  }

  .button-primary:hover {
    background-color: var(--secondary-accent);
    transform: scale(1.05);
  }

  .button-primary:active {
    transform: scale(0.98);
  }
  .button-primary:disabled {
    background-color: var(--secondary-text);
    cursor: not-allowed;
    transform: scale(1);
  }

  .generate-button {
    width: 100%;
    padding: 15px;
    font-size: 1.2rem;
  }

  .status p {
    font-style: italic;
    color: var(--secondary-text);
  }

  .results h2 {
    color: var(--primary-accent);
    margin-bottom: 1.5rem;
  }

  .result-items {
    display: flex;
    gap: 2rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .result-card {
    background-color: var(--secondary-bg);
    border-radius: var(--border-radius-lg);
    padding: 20px;
    box-shadow: 0 0 20px rgba(138, 43, 226, 0.1);
    width: 320px; /* Fixed width for consistency */
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .result-card h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: var(--primary-text);
  }

  .result-card video,
  .result-card img {
    max-width: 100%;
    height: auto;
    border-radius: var(--border-radius-sm);
    margin-bottom: 1rem;
  }

  .download-button {
    display: inline-block;
    margin-top: auto; /* Pushes button to bottom if card content varies */
  }

  .start-over-button {
    background-color: transparent;
    color: var(--secondary-accent);
    border: 2px solid var(--secondary-accent);
    padding: 10px 20px;
    border-radius: var(--border-radius-sm);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
  }

  .start-over-button:hover {
    background-color: var(--secondary-accent);
    color: var(--primary-text);
    transform: scale(1.05);
  }
  .start-over-button:disabled {
    border-color: var(--secondary-text);
    color: var(--secondary-text);
    cursor: not-allowed;
    transform: scale(1);
  }

</style>
