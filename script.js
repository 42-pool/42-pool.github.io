let exerciseData = null;

// Fetch and render content from JSON
fetch('content.json')
	.then(response => response.json())
	.then(data => {
		exerciseData = data;
		renderPage(data);
	});

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
	if (hash) {
		const target = document.getElementById(hash.slice(1));
		if (target) {
			target.scrollIntoView({ behavior: 'smooth' });
		}
	} else {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
}

function debounce(fn, delay) {
	let timeoutId;
	return function (...args) {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => fn.apply(this, args), delay);
	};
}

function renderPage(data) {
	const toc = document.getElementById('toc');
	const content = document.getElementById('content');

	const loadingElements = document.querySelectorAll('.loading');
	loadingElements.forEach(element => element.remove());

	// Table of contents
	let tocHTML = '<ul>';
	data.days.forEach((day, dayIdx) => {
		tocHTML += `<li><a href="#${day.day}">${day.title}</a><ul>`;
		day.exercises.forEach((ex, exIdx) => {
			tocHTML += `<li><a href="#${day.day}-${exIdx}">${ex.title}</a></li>`;
		});
		tocHTML += '</ul></li>';
	});
	tocHTML += '</ul>';
	toc.innerHTML = tocHTML;

	// Content generation
	data.days.forEach((day, dayIdx) => {
		const daySection = document.createElement('section');
		daySection.className = 'day';
		daySection.id = `${day.day}`;

		let html = `<h2>${day.title}</h2>`;
		day.exercises.forEach((ex, exIdx) => {
			html += `
        <div class="exercise" id="${day.day}-${exIdx}">
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

	hljs.highlightAll();

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

// Search filter logic
document.getElementById('search').addEventListener(
	'input',
	debounce(function (e) {
		const query = e.target.value.toLowerCase().trim();

		const allDays = document.querySelectorAll('.day');
		const allTOCItems = document.querySelectorAll('#toc > ul > li');

		allDays.forEach((day, dayIdx) => {
			let exercises = day.querySelectorAll('.exercise');
			let visibleExercises = 0;

			exercises.forEach((exercise, exIdx) => {
				const title = exercise.querySelector('h3')?.textContent.toLowerCase() || '';
				const description = exercise.querySelector('p')?.textContent.toLowerCase() || '';
				const codeBlocks = exercise.querySelectorAll('code');
				const code = Array.from(codeBlocks)
					.map(cb => cb.textContent.toLowerCase())
					.join(' ');

				const matches =
					title.includes(query) || description.includes(query) || code.includes(query);
				exercise.style.display = matches ? '' : 'none';
				if (matches) visibleExercises++;
			});

			// Show or hide day section
			day.style.display = visibleExercises > 0 ? '' : 'none';

			// Update TOC for this day
			const tocDay = allTOCItems[dayIdx];
			if (tocDay) {
				const tocLinks = tocDay.querySelectorAll('ul > li');
				let visibleLinks = 0;

				tocLinks.forEach((link, exIdx) => {
					const ex = exercises[exIdx];
					const isVisible = ex && ex.style.display !== 'none';
					link.style.display = isVisible ? '' : 'none';
					if (isVisible) visibleLinks++;
				});

				tocDay.style.display = visibleLinks > 0 ? '' : 'none';
			}
		});

		// Show a message in TOC if all are hidden
		const toc = document.getElementById('toc');
		const allTOCItemsVisible = Array.from(allTOCItems).some(item => item.style.display !== 'none');

		let noResultsMessage = document.getElementById('no-results-message');
		if (!allTOCItemsVisible) {
			if (!noResultsMessage) {
				noResultsMessage = document.createElement('p');
				noResultsMessage.id = 'no-results-message';
				noResultsMessage.textContent = 'No exercises match your search.';
				noResultsMessage.style.color = '#999';
				noResultsMessage.style.fontStyle = 'italic';
				toc.appendChild(noResultsMessage);
			}
		} else {
			if (noResultsMessage) {
				noResultsMessage.remove();
			}
		}
	}, 200)
);

document.addEventListener('DOMContentLoaded', () => {
	const goTopBtn = document.getElementById('goTopBtn');

	// Scroll event throttling using requestAnimationFrame
	let ticking = false;

	function handleScroll() {
		const scrollY = window.scrollY || document.documentElement.scrollTop;
		goTopBtn.style.display = scrollY > 200 ? 'block' : 'none';
		ticking = false;
	}

	window.addEventListener('scroll', () => {
		if (!ticking) {
			window.requestAnimationFrame(handleScroll);
			ticking = true;
		}
	});

	goTopBtn.addEventListener('click', () => {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	});
});
