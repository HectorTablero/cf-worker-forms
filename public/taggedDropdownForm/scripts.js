const AUTO_SAVE_INTERVAL_MS = 10000; // 10 seconds, set to 0 to disable auto-save
let previousAnswers = savedAnswers || {};
let autoSaveTimer;

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
							<img src="${person.img}" class="user-img" alt="${person.name}">
							<div class="user-info">
								<div class="name">${person.name}</div>
								<div class="email">${person.email}</div>
								<div class="tags">
									${person.badges
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

	fetch(window.location.pathname, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(answers),
	}).then(() => {
		if (!isAutoSave) {
			const saveAnswersBtn = document.getElementById('saveAnswers');
			saveAnswersBtn.classList.remove('loading');
		}
	});
}

initializeApp();

window.addEventListener('beforeunload', () => {
	if (autoSaveTimer) {
		clearInterval(autoSaveTimer);
	}
});
