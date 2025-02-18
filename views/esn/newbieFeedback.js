export const newbieFeedback = (newbieList, email, savedAnswers) => `
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Form de Feedback de Newbies</title>
        <link rel="stylesheet" href="/taggedDropdownForm/styles.css" />
    </head>
    <body>
        <!-- Configuration variables -->
        <script>
            const viewerEmail = "${email}";
            const formQuestions = [
                { id: "actis", label: "En que actis le has visto?", type: "textarea" },
                { id: "estres", label: "Cómo crees que reaccionaría en situaciones de estrés?", type: "textarea" },
                { id: "descripcion", label: "Descríbele en unas pocas palabras", type: "text" },
                { id: "extra", label: "Quieres darnos algún feedback adicional?", type: "textarea" }
            ];

            const savedAnswers = ${savedAnswers};

            const peopleData = ${typeof newbieList === 'string' ? newbieList : JSON.stringify(newbieList)};
        </script>

        <div id="app"></div>

        <script src="/taggedDropdownForm/scripts.js"></script>
    </body>
</html>
`;
