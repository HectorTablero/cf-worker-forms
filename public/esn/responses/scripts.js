// Group responses by target user (using the user's email as key)
function groupResponses() {
	const grouped = {};
	responses.forEach((item) => {
		Object.entries(item).forEach(([targetEmail, answer]) => {
			if (Object.values(answer).filter((v) => v).length > 0) {
				if (!grouped[targetEmail]) {
					grouped[targetEmail] = [];
				}
				grouped[targetEmail].push(answer);
			}
		});
	});
	return grouped;
}

// Render the responses on the page
// Render the responses on the page using an accordion layout
function renderResponses(grouped) {
	const container = document.getElementById('responsesContainer');
	container.innerHTML = '';

	for (const email in grouped) {
		const userGroup = grouped[email];
		// Find the person data (name, pfp, etc.) using the email
		const person = peopleData.find((p) => p.email === email) || {};

		// Create the accordion container and set its data-email attribute
		const accordion = document.createElement('div');
		accordion.classList.add('accordion');
		accordion.dataset.email = email;

		// ---------------------------
		// Create the accordion header
		// ---------------------------
		const accordionHeader = document.createElement('div');
		accordionHeader.classList.add('accordion-header');

		// User image (using person's pfp or a default image)
		const userImg = document.createElement('img');
		userImg.classList.add('user-img');
		userImg.src = person.img || 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg';
		userImg.alt = person.name || email;
		accordionHeader.appendChild(userImg);

		// User info: name, email and a placeholder for tags
		const userInfo = document.createElement('div');
		userInfo.classList.add('user-info');

		const nameDiv = document.createElement('div');
		nameDiv.classList.add('name');
		nameDiv.textContent = person.name || email;
		userInfo.appendChild(nameDiv);

		const emailDiv = document.createElement('div');
		emailDiv.classList.add('email');
		emailDiv.textContent = email;
		userInfo.appendChild(emailDiv);

		const tagsDiv = document.createElement('div');
		tagsDiv.classList.add('tags');
		// (You can add tags here if needed)
		userInfo.appendChild(tagsDiv);

		accordionHeader.appendChild(userInfo);

		// Toggle icon (SVG) for the accordion header
		const toggleIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		toggleIcon.setAttribute('class', 'toggle-icon');
		toggleIcon.setAttribute('width', '24');
		toggleIcon.setAttribute('height', '24');
		toggleIcon.setAttribute('viewBox', '0 0 24 24');
		toggleIcon.setAttribute('fill', 'none');
		toggleIcon.setAttribute('stroke', 'currentColor');

		const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		path.setAttribute('stroke-linecap', 'round');
		path.setAttribute('stroke-linejoin', 'round');
		path.setAttribute('stroke-width', '2');
		path.setAttribute('d', 'M19 9l-7 7-7-7');
		toggleIcon.appendChild(path);

		accordionHeader.appendChild(toggleIcon);
		accordion.appendChild(accordionHeader);

		// -----------------------------
		// Create the accordion content
		// -----------------------------
		const accordionContent = document.createElement('div');
		accordionContent.classList.add('accordion-content');

		// For each response submitted for this user…
		userGroup.forEach((responseData, index) => {
			// Wrap each response in its own container
			const responseDiv = document.createElement('div');
			responseDiv.classList.add('response');

			// Optional: Add a header for the response
			const responseHeader = document.createElement('h3');
			responseHeader.textContent = `Respuesta ${index + 1}`;
			responseDiv.appendChild(responseHeader);

			// For each answer (keyed by question id) in the response…
			for (const questionId in responseData) {
				const answer = responseData[questionId];
				// Find the corresponding question (to get the label)
				const question = formQuestions.find((q) => q.id === questionId);
				if (!question) continue;

				// Create a form-group for this question/answer
				const formGroup = document.createElement('div');
				formGroup.classList.add('form-group');

				// Display the answer with the question label in bold (you can adjust the format if needed)
				const para = document.createElement('p');
				para.innerHTML = `<strong>${question.label}</strong><br>${answer.replace(/\n/g, '<br>')}`;
				formGroup.appendChild(para);

				responseDiv.appendChild(formGroup);
			}

			accordionContent.appendChild(responseDiv);
		});

		// Add a button to export this user's feedback to a PDF
		const pdfButton = document.createElement('button');
		pdfButton.textContent = 'Exportar a PDF';
		pdfButton.addEventListener('click', () => exportUserToPDF(email));
		accordionContent.appendChild(pdfButton);

		accordion.appendChild(accordionContent);
		container.appendChild(accordion);
	}

	// Add accordion toggle functionality
	document.querySelectorAll('.accordion-header').forEach((header) => {
		header.addEventListener('click', () => {
			header.parentElement.classList.toggle('active');
		});
	});
}

// Delete all answers (send POST with action=deleteAll)
async function deleteAllAnswers() {
	const button = document.getElementById('deleteAll');
	button.classList.add('loading');
	if (!confirm('Seguro que quieres borrar todas las respuestas?')) {
		button.classList.remove('loading');
		return;
	}
	const formData = new FormData();
	formData.append('action', 'deleteAll');
	const response = await fetch(window.location.pathname, {
		method: 'POST',
		body: formData,
	});
	button.classList.remove('loading');
	if (response.ok) {
		location.reload();
	} else {
		alert('Error al eliminar las respuestas.');
	}
}

// Update the list (send POST with action=updateList and the JSON)
async function updateList() {
	const button = document.getElementById('updateList');
	button.classList.add('loading');
	const listJSON = document.getElementById('listJSON').value;
	try {
		JSON.parse(listJSON);
	} catch (e) {
		alert('JSON inválido');
		return;
	}
	const formData = new FormData();
	formData.append('action', 'updateList');
	formData.append('list', listJSON);
	const response = await fetch(window.location.pathname, {
		method: 'POST',
		body: formData,
	});
	button.classList.remove('loading');
	if (response.ok) {
		location.reload();
	} else {
		alert('Error al actualizar la lista.');
	}
}

// Export a single user's responses to PDF using jsPDF
async function exportUserToPDF(email) {
	var source = document.querySelector(`.accordion[data-email="${email}"]`);
	source.classList.add('forceactive');

	const doc = new jspdf.jsPDF({
		orientation: 'portrait',
		unit: 'mm',
		format: 'a4',
	});

	const userName = peopleData.find((person) => person.email === email).name;
	const fileName = `Feedback ${userName}`;

	doc.html(source, {
		callback: function (doc) {
			source.classList.remove('forceactive');
			const pdfBlob = doc.output('blob');
			const pdfUrl = URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));

			const wrapperHtml = `
				<html>
				<head>
					<meta charset="UTF-8" />
					<title>${fileName}</title>
				</head>
				<body style="margin: 0;">
					<iframe src="${pdfUrl}" style="border: none; width: 100vw; height: 100vh;"></iframe>
				</body>
				</html>
			`;
			const wrapperBlob = new Blob([wrapperHtml], { type: 'text/html' });
			const wrapperUrl = URL.createObjectURL(wrapperBlob);
			window.open(wrapperUrl, '_blank');
			doc.save(`${fileName}.pdf`);
		},
		x: 15,
		y: 15,
		width: 180,
		windowWidth: source.scrollWidth,
	});
}

// Export all user PDFs as a ZIP using JSZip
async function exportAllAsZip() {
	const grouped = groupResponses(responses);
	const zip = new JSZip();

	for (const email in grouped) {
		var source = document.querySelector(`.accordion[data-email="${email}"]`);
		source.classList.add('forceactive');

		const doc = new jspdf.jsPDF({
			orientation: 'portrait',
			unit: 'mm',
			format: 'a4',
		});

		const userName = peopleData.find((person) => person.email === email).name;
		const fileName = `Feedback ${userName}`;

		await new Promise((resolve) => {
			doc.html(source, {
				callback: function (doc) {
					const pdfBlob = doc.output('blob');
					zip.file(`${fileName}.pdf`, pdfBlob);
					source.classList.remove('forceactive');
					resolve();
				},
				x: 15,
				y: 15,
				width: 180,
				windowWidth: source.scrollWidth,
			});
		});
	}

	const zipBlob = await zip.generateAsync({ type: 'blob' });
	const url = URL.createObjectURL(zipBlob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'Feedback.zip';
	a.click();
	URL.revokeObjectURL(url);
}

// Load responses and render the UI
async function loadResponses() {
	const grouped = groupResponses(responses);
	renderResponses(grouped);
}

// Event listeners for the admin controls
document.getElementById('deleteAll').addEventListener('click', deleteAllAnswers);
document.getElementById('updateList').addEventListener('click', updateList);
document.getElementById('exportAllZip').addEventListener('click', exportAllAsZip);

// Initial load
loadResponses();
