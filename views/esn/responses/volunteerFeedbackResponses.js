export const volunteerFeedbackResponses = (userList, responses) => `
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
      const formQuestions = [];
    </script>
    <div class="container">
      <h1>Feedback de Voluntarios</h1>

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
