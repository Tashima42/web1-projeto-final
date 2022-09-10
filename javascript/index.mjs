import { User, Vaccine, Storage } from "./firebase.mjs"

var viewName = null
const query = parseQuery(window.location.href.split("?")[1]);
const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null
var vaccines = []
const modal = document.getElementById("modal");
const editVaccineElement = document.querySelector(".edit-vaccine");
const headerElement = document.querySelector("header")

async function main() {
  viewName = getLocation()
  autoLogin()
  await getVaccines()
  populateVaccineCards(vaccines)
  getVaccineInformation()
}
main()

function getLocation() {
  const location = window.location.href.split("/")
  const view = location[location.length - 1]
  return view.split(".html")[0]
}

function parseQuery(queryString = "") {
  var query = {};
  var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split('=');
    query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
  }
  return query;
}

function isValidDate(d) {
  return d instanceof Date && !isNaN(d);
}

function createAccount() {
  const name = document.getElementById("new-account-name").value
  const sex = document.querySelector('input[name="sex"]:checked').value;
  const birthDate = new Date(document.getElementById("new-account-birth-date").value)
  const email = document.getElementById("new-account-email").value
  const password = document.getElementById("new-account-password").value
  const repeatPassword = document.getElementById("new-account-repeat-password").value

  if (!name) {
    document.getElementById("create-account-warning").innerText = "Nome invalido"
    return
  }
  if (!sex) {
    document.getElementById("create-account-warning").innerText = "Sexo invalido"
    return
  }
  if (!isValidDate(birthDate)) {
    document.getElementById("create-account-warning").innerText = "Data de nascimento invalida"
    return
  }
  if (!email) {
    document.getElementById("create-account-warning").innerText = "Email invalido"
    return
  }
  if (!password) {
    document.getElementById("create-account-warning").innerText = "Senha invalida"
    return
  }
  if (!repeatPassword) {
    document.getElementById("create-account-warning").innerText = "Repetir senha invalida"
    return
  }
  if (password != repeatPassword) {
    document.getElementById("create-account-warning").innerText = "Senha não confere!"
    return
  }
  User.create(email, password, birthDate, name, sex).then(userFound => {
    localStorage.setItem("user", JSON.stringify(userFound))
    window.location.href = "../views/home.html"
  })
}

function login() {
  const email = document.getElementById("login-email").value
  const password = document.getElementById("login-password").value
  if (!email) {
    document.getElementById("login-warning").innerText = "Email invalido"
    return
  }
  if (!password) {
    document.getElementById("login-warning").innerText = "Senha invalida"
    return
  }

  User.signIn(email, password).then(userFound => {
    localStorage.setItem("user", JSON.stringify(userFound))
    window.location.href = "../views/home.html"
  }).catch(error => {
    document.getElementById("login-warning").innerText = "E-mail e/ou senha inválidos."
  })
}

function forgotPassword() {
  const email = document.getElementById("forgot-email").value

  User.resetPassword(email).then(_ => {
    window.location.href = "../views/enter-account.html"
  })
}

function logout() {
  localStorage.removeItem("user")
  window.location.href = "../index.html"
}

function autoLogin() {
  if (user !== null && (viewName === "index" || viewName === "")) {
    window.location.href = "../views/home.html"
  }
}

function getVaccineInformation() {
  if (viewName != "edit-vaccine") return

  const { id } = query

  const date = document.getElementById("edit-vaccine-date")
  const name = document.getElementById("edit-vaccine-name")
  const nextDose = document.getElementById("edit-vaccine-next-dose")
  const image = document.getElementById("edit-vaccine-image")

  Vaccine.getById(id).then(vaccine => {
    document.getElementById(parseDose(vaccine.dose)).checked = true
    date.valueAsDate = vaccine.date
    name.value = vaccine.name
    nextDose.valueAsDate = vaccine.nextDose
    image.src = vaccine.proofImage
  })

  function parseDose(dose) {
    if (dose === "1a. dose") return '1a'
    if (dose === "2a. dose") return '2a'
    if (dose === "3a. dose") return '3a'
    if (dose === "Dose única") return 'unica'
    if (dose === "Reforço") return 'reforco'
  }
}

function onFileUpload() {
  const file = document.getElementById(`${viewName}-file`).files[0]
  const name = file.name
  getBase64(file).then(base64 => {
    Storage.upload(name, base64).then(fileUrl => {
      document.getElementById(`${viewName}-image`).src = fileUrl
    })
  })

  function getBase64(file) {
    return new Promise((resolve) => {
      var reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        resolve(reader.result)
      }
    })
  }
}

function newVaccine() {
  const date = new Date(document.getElementById("new-vaccine-date").value)
  const name = document.getElementById("new-vaccine-name").value
  const dose = document.querySelector('input[name="dose"]:checked').value;
  const image = document.getElementById("new-vaccine-image").src
  const nextDose = new Date(document.getElementById("new-vaccine-next-dose").value)
  const { uid } = user

  if (!isValidDate(date)) {
    document.getElementById("new-vaccine-warning").innerText = "Data invalida"
    return
  }
  if (!name) {
    document.getElementById("new-vaccine-warning").innerText = "Vacina invalida"
    return
  }
  if (!image) {
    document.getElementById("new-vaccine-warning").innerText = "Comprovante invalido"
    return
  }
  if (!isValidDate(nextDose)) {
    document.getElementById("new-vaccine-warning").innerText = "Proxima data invalida"
    return
  }

  Vaccine.create(date, dose, name, nextDose, image, uid).then(_ => {
    window.location.href = "../views/home.html"
  })
}

function updateVaccine() {
  const { id } = query

  const date = new Date(document.getElementById("edit-vaccine-date").value)
  const name = document.getElementById("edit-vaccine-name").value
  const dose = document.querySelector('input[name="dose"]:checked').value;
  const image = document.getElementById("edit-vaccine-image").src
  const nextDose = new Date(document.getElementById("edit-vaccine-next-dose").value)
  const { uid } = user

  if (!isValidDate(date)) {
    document.getElementById("edit-vaccine-warning").innerText = "Data invalida"
    return
  }
  if (!name) {
    document.getElementById("edit-vaccine-warning").innerText = "Vacina invalida"
    return
  }
  if (!image) {
    document.getElementById("edit-vaccine-warning").innerText = "Comprovante invalido"
    return
  }
  if (!isValidDate(nextDose)) {
    document.getElementById("edit-vaccine-warning").innerText = "Proxima data invalida"
    return
  }

  Vaccine.update(id, date, dose, name, nextDose, image, uid).then(_ => {
    window.location.href = "../views/home.html"
  })
}

function showDeleteVaccineModal() {
  showModal("Tem certeza que deseja remover essa vacina?")
}
function deleteVaccine() {
  const { id } = query

  Vaccine.delete(id).then(_ => {
    closeModal()
    window.location.href = "../views/home.html"
  })
}
function showModal(content) {
  modal.style.display = "flex";
  editVaccineElement.classList.add("blur");
  headerElement.classList.add("blur");

  document.querySelector(".modal-content").innerText = content;
}
function closeModal() {
  modal.style.display = "none";
  editVaccineElement.classList.toggle("blur");
  headerElement.classList.toggle("blur");
}

async function getVaccines() {
  if (viewName != "home") return
  const { uid } = user
  vaccines = await Vaccine.getByUserId(uid)
}

function filterVaccines({ target: { value } }) {
  console.log(value)
  document.getElementById("vaccines").innerHTML = ""
  const vacs = vaccines.filter(vac => {
    if (vac.name.toLowerCase().includes(value)) return true
  })
  populateVaccineCards(vacs)
}

function populateVaccineCards(vaccines) {
  if (viewName != "home") return
  const vaccinesElement = document.getElementById("vaccines")

  vaccines.forEach(vaccine => {
    const { id, name, dose, date, proofImage, nextDose } = vaccine

    vaccinesElement.appendChild(createVaccineCard(
      id,
      name,
      dose,
      date.toLocaleDateString(),
      proofImage,
      nextDose.toLocaleDateString(),
    ))
  })
  return

  function createVaccineCard(id, title, dose, date, img, nextDose) {
    const vaccineElement = document.createElement("div")
    vaccineElement.classList.add("vaccine")
    vaccineElement.id = `vaccine-${id}`

    vaccineElement.onclick = () => {
      navigateToVaccinePage(id)
    }

    const titleElement = document.createElement("p")
    titleElement.classList.add("vaccine-title")
    titleElement.appendChild(document.createTextNode(title))
    titleElement.id = `vaccine-title-${id}`

    const doseElement = document.createElement("p")
    doseElement.classList.add("vaccine-dose")
    doseElement.appendChild(document.createTextNode(dose))
    doseElement.id = `vaccine-dose-${id}`

    const dateElement = document.createElement("p")
    dateElement.classList.add("vaccine-date")
    dateElement.appendChild(document.createTextNode(date))
    dateElement.id = `vaccine-date-${id}`

    const proofElement = document.createElement("img")
    proofElement.classList.add("vaccine-proof")
    proofElement.src = img
    proofElement.id = `vaccine-proof-${id}`

    const nextDoseElement = document.createElement("p")
    nextDoseElement.classList.add("vaccine-next-dose")
    nextDoseElement.appendChild(document.createTextNode(nextDose))
    nextDoseElement.id = `vaccine-next-dose-${id}`

    vaccineElement.appendChild(titleElement)
    vaccineElement.appendChild(doseElement)
    vaccineElement.appendChild(dateElement)
    vaccineElement.appendChild(proofElement)
    vaccineElement.appendChild(nextDoseElement)

    return vaccineElement

    function navigateToVaccinePage(id) {
      window.location.href = `../views/edit-vaccine.html?id=${id}`
    }
  }
}

const createAccountBtn = document.getElementById("create-account-btn")
const logoutBtn = document.getElementById("logout-btn")
const loginBtn = document.getElementById("login-btn")
const forgotPasswordBtn = document.getElementById("forgot-password-btn")
const editVaccineFileInput = document.getElementById("edit-vaccine-file")
const editVaccineBtn = document.getElementById("edit-vaccine-btn")
const newVaccineFileInput = document.getElementById("new-vaccine-file")
const newVaccineBtn = document.getElementById("new-vaccine-btn")
const vaccineSearchInput = document.getElementById("search")
const deleteVaccineBtn = document.getElementById("delete-vaccine")
const modalOkBtn = document.getElementById("modal-ok")
const modalCloseBtn = document.getElementById("modal-close")

if (createAccountBtn) createAccountBtn.onclick = createAccount
if (logoutBtn) logoutBtn.onclick = logout
if (loginBtn) loginBtn.onclick = login
if (forgotPasswordBtn) forgotPasswordBtn.onclick = forgotPassword
if (editVaccineFileInput) editVaccineFileInput.onchange = onFileUpload
if (editVaccineBtn) editVaccineBtn.onclick = updateVaccine
if (newVaccineFileInput) newVaccineFileInput.onchange = onFileUpload
if (newVaccineBtn) newVaccineBtn.onclick = newVaccine
if (vaccineSearchInput) vaccineSearchInput.oninput = filterVaccines
if (deleteVaccineBtn) deleteVaccineBtn.onclick = showDeleteVaccineModal
if (modalOkBtn) modalOkBtn.onclick = deleteVaccine
if (modalCloseBtn) modalCloseBtn.onclick = closeModal

