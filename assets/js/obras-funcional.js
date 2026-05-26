document.addEventListener("DOMContentLoaded", () => {

  const galleryGrid = document.getElementById("gallery-grid");
  const loading = document.getElementById("gallery-loading");
  const error = document.getElementById("gallery-error");

  fetch("../data/obras.json")
    .then(response => {
      if (!response.ok) {
        throw new Error("No se pudo cargar el JSON");
      }
      return response.json();
    })
    .then(obras => {

      loading.style.display = "none";
      error.hidden = true;

      obras.forEach(obra => {

        const card = document.createElement("div");
        card.classList.add("obra-card");

        card.innerHTML = `
          <img src="${obra.imagen}" alt="${obra.titulo}">
          <div class="obra-info">
            <h3>${obra.titulo}</h3>
            <p>${obra.tecnica}</p>
            <p>${obra.anio}</p>
          </div>
        `;

        galleryGrid.appendChild(card);

      });

    })
    .catch(err => {

      console.error(err);

      loading.style.display = "none";
      error.hidden = false;

    });

});
