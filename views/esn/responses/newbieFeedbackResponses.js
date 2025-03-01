export const newbieFeedbackResponses = (userList, responses) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Panel de Administrador - Feedback</title>
    <link rel="stylesheet" href="/taggedDropdownForm/styles.css" />
    <link rel="stylesheet" href="/esn/responses/styles.css" />
    <!-- Include jsPDF and JSZip from CDNs -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
  </head>
  <body>
    <script>
      const peopleData = ${typeof userList === 'string' ? userList : JSON.stringify(userList)};
      const responses = ${typeof responses === 'string' ? responses : JSON.stringify(responses)};
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
        { id: "estres", label: "Cómo crees que reaccionaría en situaciones de estrés?", type: "textarea" },
        { id: "descripcion", label: "Descríbele en unas pocas palabras", type: "text" },
        { id: "extra", label: "Quieres darnos algún feedback adicional?", type: "textarea" }
      ];
    </script>
    <div class="container">
      <h1>Feedback de Newbies</h1>

      <!-- Admin controls -->
      <div id="adminControls">
        <button id="deleteAll">Eliminar Todas las Respuestas</button>
        <h2>Actualizar la Lista de Usuarios</h2>
        <textarea id="listJSON" rows="10" cols="50" placeholder="Pega el JSON aquí"></textarea>
        <br />
        <button id="updateList">Actualizar la Lista</button>
      </div>

      <!-- Container for responses grouped by target user -->
      <h2>Respuestas</h2>
      <div id="responsesContainer"></div>

      <!-- Export All ZIP button -->
      <button id="exportAllZip">Exportar Todos Como ZIP</button>
    </div>

    <script>document.getElementById("listJSON").value = JSON.stringify(peopleData);</script>
    <script src="/esn/responses/scripts.js"></script>
  </body>
</html>
`;
