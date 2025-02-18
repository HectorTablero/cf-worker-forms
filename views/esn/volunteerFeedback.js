const badgeTranslation = {
	'Impacto Social': 'IS',
	Fiestas: 'FT',
	'GdA Vicepresidencia': 'GaVIP',
	'GdA LR': 'GaLR',
	'Cultural y Deportes': 'CyD',
	ComCom: 'ComCom',
	Tándem: 'TD',
	'GdA Secretaría': 'GAS',
	'GdA Tesorería': 'GAT',
	'GdA Webmaster': 'GAWM',
	Partners: 'Partners',
	'GdA Presidencia': 'GAP',
	'Materiales y Merchandising': 'M&M',
};

export const volunteerFeedback = (volunteerList, email, savedAnswers) => {
	if (typeof volunteerList === 'string') {
		volunteerList = JSON.parse(volunteerList);
	}
	volunteerList = volunteerList.map((volunteer) => ({
		...volunteer,
		badges: volunteer.badges.map((badge) => badgeTranslation[badge] || badge),
	}));

	return `
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Form de Feedback de Voluntarios</title>
        <link rel="stylesheet" href="/taggedDropdownForm/styles.css" />
    </head>
    <body>
        <!-- Configuration variables -->
        <script>
            const viewerEmail = "${email}";
            const formQuestions = [
                { id: "q1", label: "Ejemplo de pregunta corta", type: "text" },
                { id: "q2", label: "Ejemplo de pregunta larga", type: "textarea" }
            ];
            
            const savedAnswers = ${savedAnswers};

            const peopleData = ${JSON.stringify(volunteerList)};
        </script>

        <div id="app"></div>

        <script src="/taggedDropdownForm/scripts.js"></script>
    </body>
</html>
`;
};
