// Fetch and render content from JSON
fetch('content.json')
	.then(response => response.json())
	.then(data => renderPage(data));

// Utility to escape HTML characters in code
function escapeHTML(str) {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

function scrollToHashTarget() {
	const hash = window.location.hash;
	if (hash && hash.startsWith('#ex-')) {
		const target = document.querySelector(hash);
		if (target) {
			target.scrollIntoView({ behavior: 'smooth' });
		}
	} else {
		// Scroll to top if no valid hash
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
}

function renderPage(data) {
	const toc = document.getElementById('toc');
	const content = document.getElementById('content');

	// Delete loading elements
	const loadingElements = document.querySelectorAll('.loading');
	loadingElements.forEach(element => {
		element.remove();
	});

	// Table of contents
	let tocHTML = '<ul>';
	data.days.forEach((day, dayIdx) => {
		tocHTML += `<li><a href="#day${day.day}">Day ${day.day}</a><ul>`;
		day.exercises.forEach((ex, exIdx) => {
			tocHTML += `<li><a href="#ex-${day.day}-${exIdx}">${ex.title}</a></li>`;
		});
		tocHTML += '</ul></li>';
	});
	tocHTML += '</ul>';
	toc.innerHTML = tocHTML;

	// Content generation
	data.days.forEach((day, dayIdx) => {
		const daySection = document.createElement('section');
		daySection.className = 'day';
		daySection.id = `day${day.day}`;

		let html = `<h2>Day ${day.day}</h2>`;
		day.exercises.forEach((ex, exIdx) => {
			html += `
        <div class="exercise" id="ex-${day.day}-${exIdx}">
          <h3>${ex.title}</h3>
          <p>${marked.parse(ex.description)}</p>

          <details>
            <summary>Implementation</summary>
            <div class="code-block">
              <button class="copy-button">Copy</button>
              <pre><code class="language-c">${escapeHTML(ex.implementation)}</code></pre>
            </div>
          </details>

          <h4>Test</h4>
          <div class="code-block">
            <button class="copy-button">Copy</button>
            <pre><code class="language-c">${escapeHTML(ex.tests)}</code></pre>
          </div>
        </div>
      `;
		});

		daySection.innerHTML = html;
		content.appendChild(daySection);
	});

	// Highlight code
	hljs.highlightAll();

	// Enable copy functionality
	document.querySelectorAll('.copy-button').forEach(button => {
		button.addEventListener('click', () => {
			const code = button.nextElementSibling.querySelector('code').innerText;
			navigator.clipboard.writeText(code).then(() => {
				button.classList.add('copied');
				button.innerText = 'Copied!';
				setTimeout(() => {
					button.classList.remove('copied');
					button.innerText = 'Copy';
				}, 1500);
			});
		});
	});

	setTimeout(scrollToHashTarget, 100);

	fetch('https://api.github.com/repos/42-pool/42-pool.github.io/commits?per_page=1')
		.then(response => response.json())
		.then(data => {
			const lastCommitDate = new Date(data[0].commit.committer.date);
			const formattedDate = lastCommitDate.toLocaleString(undefined, {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			});
			document.getElementById('last-updated').textContent = `Last updated: ${formattedDate}`;
		})
		.catch(error => {
			console.error('Error fetching commit data:', error);
			document.getElementById('last-updated').textContent = 'Last updated: Unknown';
		});
}

// Re-scroll on hash change
window.addEventListener('hashchange', () => {
	scrollToHashTarget();
});
