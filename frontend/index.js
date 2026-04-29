const API_URL = "http://localhost:8000/students";

document.addEventListener('DOMContentLoaded', () =>{
    setupForm();
})

function setupForm() {
    const form = document.getElementById('student-form');
    form.addEventListener('submit', (e)=>{
        e.preventDefault();
        saveStudents();
    })
}

function saveStudents() {
    const id = document.getElementById("student-id").value;
    const name = document.getElementById("name").value;
    const age = parseInt(document.getElementById("age").value);
    const grade = parseFloat(document.getElementById("grade").value);

    const studentData = {name, age, grade};

    const method = id ? "PUT" : "POST";
    const url = id ? `${API_URL}/${id}` : API_URL;
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json' //MIME
        },
        body: JSON.stringify(studentData)
    }).then( response => {
        if (!response.ok){
            return response.json().then(err => {throw new Error(err.detail || 'Error en la operación')})
        }
        return response.json()
    }).then(data =>{
        alert("Estudiante creado")
    })

}
