export const newbieFeedbackFromVolunteers = (newbieList, email, savedAnswers) => `
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Form de Feedback de Newbies (Voluntarios)</title>
        <link rel="stylesheet" href="/taggedDropdownForm/styles.css" />
    </head>
    <body>
        <!-- Configuration variables -->
        <script>
            const viewerEmail = "${email}";
            const formQuestions = [
                { id: "actis", label: "En que actis le has visto?", type: "textarea" },
                { id: "interacciones", label: "Cómo ha interactuado con erasmus y otros voluntarios? Green & Red flags?", type: "textarea" },
                { id: "encaja", label: "Dónde crees que podría encajar mejor (comités / actis semanales / cargos)? (intenta añadir un breve comentario de por qué)", type: "textarea" },
                { id: "entrar", label: "Crees que debría entrar este recruitment?", type: "choice", options: [
                    "Sí, ha demostrado tener mucho potencial",
                    "Sí, todavía tiene margen para mostrar su aporte, pero se le puede dar una oportunidad",
                    "No, no ha demostrado mucho interés o no encaja con los valores de ESN UAM",
                    "No sé, todavía necesitaría más información para poder decidir"
                ] },
                { id: "extra", label: "Quieres dar algún feedback adicional?", type: "textarea" }
            ];

            const savedAnswers = ${savedAnswers};

            const peopleData = ${typeof newbieList === 'string' ? newbieList : JSON.stringify(newbieList)};
        </script>

        <div id="app"></div>

        <script src="/taggedDropdownForm/scripts.js"></script>
    </body>
</html>
`;
