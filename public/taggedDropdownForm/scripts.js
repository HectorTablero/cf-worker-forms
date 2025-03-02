// TODO: Unify all the code to send the data and use only code specific functions to render the form and extract the answers

const AUTO_SAVE_INTERVAL_MS = 10000; // 10 seconds, set to 0 to disable auto-save
let previousAnswers = savedAnswers || {};
let autoSaveTimer;

// 1. Create the badge element and inject the CSS for the badge and animations.
(function createSaveBadge() {
	// Create the badge element.
	const badge = document.createElement('div');
	badge.id = 'saveBadge';
	document.body.appendChild(badge);

	// Create a global saveBadge helper object to control the badge.
	window.saveBadge = {
		badgeElement: badge,
		// SVG icons provided in the instructions:
		savingIcon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed"><path d="M204-318q-22-38-33-78t-11-82q0-134 93-228t227-94h7l-64-64 56-56 160 160-160 160-56-56 64-64h-7q-100 0-170 70.5T240-478q0 26 6 51t18 49l-60 60ZM481-40 321-200l160-160 56 56-64 64h7q100 0 170-70.5T720-482q0-26-6-51t-18-49l60-60q22 38 33 78t11 82q0 134-93 228t-227 94h-7l64 64-56 56Z"/></svg>`,
		checkIcon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>`,
		errorIcon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>`,
		// Shows the badge with a specific status.
		show: function (status) {
			// Clear any pending hide timeout.
			if (this.hideTimeout) {
				clearTimeout(this.hideTimeout);
			}
			// Update badge content based on status.
			if (status === 'saving') {
				this.badgeElement.innerHTML = `<span class="icon spinning">${this.savingIcon}</span><span class="text">Guardando...</span>`;
			} else if (status === 'saved') {
				this.badgeElement.innerHTML = `<span class="icon">${this.checkIcon}</span><span class="text">Guardado</span>`;
			} else if (status === 'error') {
				this.badgeElement.innerHTML = `<span class="icon">${this.errorIcon}</span><span class="text">Error</span>`;
			}
			// Ensure that the spinning animation is applied only when saving.
			const iconSpan = this.badgeElement.querySelector('.icon');
			if (iconSpan && status !== 'saving') {
				iconSpan.classList.remove('spinning');
			}
			// Slide the badge into view.
			this.badgeElement.classList.add('visible');
		},
		// Hides the badge by sliding it out.
		hide: function () {
			this.badgeElement.classList.remove('visible');
		},
		// Schedules the badge to slide up after a given delay (in ms).
		scheduleHide: function (delay) {
			var self = this;
			this.hideTimeout = setTimeout(function () {
				self.hide();
			}, delay);
		},
	};
})();

function initializeApp() {
	const viewer = peopleData.find((p) => p.email === viewerEmail) || { email: viewerEmail, badges: [] };
	const viewerBadges = new Set(viewer.badges);

	const sharedBadgePeople = [];
	const otherPeople = [];

	peopleData.forEach((person) => {
		if (person.email === viewerEmail) return;

		try {
			const hasCommonBadge = person.badges.some((c) => viewerBadges.has(c));
			if (hasCommonBadge) {
				sharedBadgePeople.push(person);
			} else {
				otherPeople.push(person);
			}
		} catch (e) {
			otherPeople.push(person);
		}
	});

	function checkFilledState(personEmail) {
		try {
			const allFilled = formQuestions.every((q) => {
				const input = document.getElementById(`${personEmail}-${q.id}`);
				return input.value.trim() !== '';
			});
			const accordion = document.querySelector(`.accordion[data-email="${personEmail}"]`);
			if (allFilled) {
				accordion.classList.add('filled');
			} else {
				accordion.classList.remove('filled');
			}
		} catch (e) {}
	}

	function createAccordionGroup(people, title) {
		if (people.length === 0) return '';

		return `
			<div class="badge-group">
				${title ? '<h2>' + title + '</h2>' : ''}
				${people
					.map(
						(person) => `
					<div class="accordion" data-email="${person.email}">
						<div class="accordion-header">
							<img src="${person.img || 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg'}" class="user-img" alt="${person.name}">
							<div class="user-info">
								<div class="name">${person.name}</div>
								<div class="email">${person.email}</div>
								<div class="tags">
									${(person.badges || [])
										.map(
											(c) => `
										<span class="tag">${c}</span>
									`
										)
										.join('')}
								</div>
							</div>
							<svg class="toggle-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
							</svg>
						</div>
						<div class="accordion-content">
							${formQuestions
								.map(
									(q) => `
								<div class="form-group">
									<label>${q.label}</label>
									${
										q.type === 'textarea'
											? `
										<textarea id="${person.email}-${q.id}">${savedAnswers[person.email]?.[q.id] || ''}</textarea>
										`
											: q.type === 'choice'
											? `
										<select id="${person.email}-${q.id}">
											<option value="" selected>Selecciona una opción...</option>
											${q.options
												.map(
													(option) => `
												<option value="${option}" ${savedAnswers[person.email]?.[q.id] === option ? 'selected' : ''}>
													${option}
												</option>
											`
												)
												.join('')}
										</select>
										`
											: q.type === 'checkbox'
											? `
										<div class="checkbox-group">
											${q.options
												.map(
													(option) => `
												<label>
													<input 
														type="checkbox" 
														value="${option}"
														${(savedAnswers[person.email]?.[q.id] || []).includes(option) ? 'checked' : ''}
													>
													${option}
												</label>
											`
												)
												.join('')}
										</div>
										`
											: `
										<input 
											type="${q.type}" 
											id="${person.email}-${q.id}" 
											value="${savedAnswers[person.email]?.[q.id] || ''}"
										>
										`
									}
								</div>
							`
								)
								.join('')}
						</div>
					</div>
				`
					)
					.join('')}
			</div>
		`;
	}

	let appHTML = '';
	if (sharedBadgePeople.length === 0 || otherPeople.length === 0) {
		appHTML = `
			${createAccordionGroup(
				peopleData.filter((person) => person.email !== viewerEmail),
				''
			)}
		`;
	} else {
		const plural = viewerBadges.size > 1 ? 's' : '';
		appHTML = `
			${createAccordionGroup(sharedBadgePeople, `Personas de tu${plural} Grupo${plural}`)}
			${createAccordionGroup(otherPeople, 'Otras Personas')}
		`;
	}
	if (AUTO_SAVE_INTERVAL_MS === 0) {
		appHTML += '<button id="saveAnswers" onclick="saveAnswers()" style="position: relative;">Guardar Respuestas</button>';
	}

	document.getElementById('app').innerHTML = appHTML;

	// Add accordion toggle functionality
	document.querySelectorAll('.accordion-header').forEach((header) => {
		header.addEventListener('click', () => {
			header.parentElement.classList.toggle('active');
		});
	});

	document.querySelectorAll('input, textarea').forEach((input) => {
		input.addEventListener('input', () => {
			const personEmail = input.id.split('-')[0];
			checkFilledState(personEmail);
		});
	});

	// Check if all inputs are filled from saved data
	peopleData.forEach((person) => {
		checkFilledState(person.email);
	});

	if (AUTO_SAVE_INTERVAL_MS > 0) {
		startAutoSave();
	}

	window.addEventListener('beforeunload', (event) => {
		// Get the current answers
		const currentAnswers = updateCurrentAnswers();

		// Compare with the previously saved answers
		if (JSON.stringify(currentAnswers) !== JSON.stringify(previousAnswers)) {
			// Prepare the payload and URL
			const url = window.location.pathname;
			const payload = JSON.stringify(currentAnswers);
			const blob = new Blob([payload], { type: 'application/json' });

			// Use sendBeacon to send data reliably before unload
			navigator.sendBeacon(url, blob);
		}
	});
}

function updateCurrentAnswers() {
	const currentAnswers = {};
	peopleData.forEach((person) => {
		if (person.email === viewerEmail) return;

		const personAnswers = {};
		formQuestions.forEach((q) => {
			const element = document.getElementById(`${person.email}-${q.id}`);
			if (element) {
				if (q.type === 'checkbox') {
					const checkedOptions = Array.from(element.querySelectorAll('input[type="checkbox"]:checked')).map((checkbox) => checkbox.value);
					personAnswers[q.id] = checkedOptions;
				} else {
					personAnswers[q.id] = element.value;
				}
			}
		});
		if (Object.values(personAnswers).filter((answer) => answer !== '').length > 0) currentAnswers[person.email] = personAnswers;
	});
	return currentAnswers;
}

function startAutoSave() {
	autoSaveTimer = setInterval(() => {
		const currentAnswers = updateCurrentAnswers();
		if (JSON.stringify(currentAnswers) !== JSON.stringify(previousAnswers)) {
			previousAnswers = currentAnswers;
			saveAnswers(true); // Pass true to indicate auto-save
		}
	}, AUTO_SAVE_INTERVAL_MS);
}

function saveAnswers(isAutoSave = false) {
	const answers = updateCurrentAnswers();

	if (!isAutoSave) {
		const saveAnswersBtn = document.getElementById('saveAnswers');
		saveAnswersBtn.classList.add('loading');
	}

	window.saveBadge.show('saving');

	fetch(window.location.pathname, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(answers),
	})
		.then((response) => {
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}
			window.saveBadge.show('saved');
		})
		.catch((e) => {
			window.saveBadge.show('error');
		})
		.finally(() => {
			if (!isAutoSave) {
				const saveAnswersBtn = document.getElementById('saveAnswers');
				saveAnswersBtn.classList.remove('loading');
			}
			window.saveBadge.scheduleHide(2000);
		});
}

initializeApp();

window.addEventListener('beforeunload', () => {
	if (autoSaveTimer) {
		clearInterval(autoSaveTimer);
	}
});
