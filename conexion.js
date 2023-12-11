const mysql = require('mysql');
const express = require('express');
const app = express();
const port = 3000;

app.set('view engine', 'pug');
app.set('views', './views');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

const connection = mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '123456',
    database: 'laboratorio15'
});

connection.connect((error) => {
    if (error) {
        console.error('Error al conectar a MySQL: ', error);
        return;
    }
    console.log('Conexión exitosa a MySQL');
});

app.get('/', (req, res) => {
    connection.query('SELECT * FROM alumnos', (error, resultados) => {
        if (error) {
            console.error('Error al obtener los datos de los alumnos: ', error);
            return;
        }
        res.render('alumnos', { datos: resultados });
    });
});

app.get('/agregar/alumno', (req, res) => {
    // Obtener la lista de cursos desde la base de datos
    connection.query('SELECT * FROM cursos', (error, resultados) => {
        if (error) {
            console.error('Error al obtener la lista de cursos: ', error);
            return;
        }

        // Renderizar la vista de agregar alumno y pasar la lista de cursos
        res.render('agregarA', { cursos: resultados }); // Cambia 'alumnos' por 'cursos'
    });
});

app.post('/agregar/alumno', (req, res) => {
    const { nombre, edad, telefono, correo, id_curso } = req.body;
    const consulta = 'INSERT INTO alumnos (nombre, edad, telefono, correo, id_curso) VALUES (?, ?, ?, ?, ?)';
    connection.query(consulta, [nombre, edad, telefono, correo, id_curso], (errorAlumnos, resultsAlumnos) => {
        if (errorAlumnos) {
            console.error('Error al insertar datos en la tabla "alumnos": ', errorAlumnos);
            return;
        }

        const idAlumnoInsertado = resultsAlumnos.insertId;

        // Consulta para insertar en la tabla 'inscripciones'
        const consultaInscripciones = 'INSERT INTO inscripciones (id_alumno, id_curso) VALUES (?, ?)';
        connection.query(consultaInscripciones, [idAlumnoInsertado, id_curso], (errorInscripciones, resultsInscripciones) => {
            if (errorInscripciones) {
                console.error('Error al insertar datos en la tabla "inscripciones": ', errorInscripciones);
                return;
            }

            console.log('Alumno agregado exitosamente');
            res.redirect('/');
        });
    });
});
// Obtener datos de un alumno para editar
app.get('/editar/alumno/:id', (req, res) => {
    const id = req.params.id;
    connection.query('SELECT * FROM alumnos WHERE id = ?', [id], (errorAlumno, resultadoAlumno) => {
        if (errorAlumno) {
            console.error('Error al obtener el dato para editar: ', errorAlumno);
            return;
        }
        const alumno = resultadoAlumno[0];

        // Obtener la lista de cursos desde la base de datos
        connection.query('SELECT * FROM cursos', (errorCursos, resultadosCursos) => {
            if (errorCursos) {
                console.error('Error al obtener la lista de cursos: ', errorCursos);
                return;
            }

            res.render('editarA', { dato: alumno, cursos: resultadosCursos });
        });
    });
});

// Actualizar datos de un alumno
app.post('/actualizar/alumno/:id', (req, res) => {
    const { nombre, edad, telefono, correo } = req.body;
    const id = req.params.id;
    const consulta = 'UPDATE alumnos SET nombre = ?, edad = ?, telefono = ?, correo = ? WHERE id = ?';
    connection.query(consulta, [nombre, edad, telefono, correo, id], (error, results) => {
        if (error) {
            console.error('Error al actualizar el dato: ', error);
            return;
        }
        console.log('Dato actualizado exitosamente');
        res.redirect('/');
    });
});

// Eliminar un alumno
app.post('/eliminar/alumno/:id', (req, res) => {
    const id = req.params.id;
    connection.query('DELETE FROM alumnos WHERE id = ?', [id], (error, results) => {
        if (error) {
            console.error('Error al eliminar el dato: ', error);
            return;
        }
        console.log('Dato eliminado exitosamente');
        res.redirect('/');
    });
});

app.get('/curso', (req, res) => {
    connection.query('SELECT * FROM cursos', (error, resultados) => {
        if (error) {
            console.error('Error al obtener los cursos: ', error);
            return;
        }
        res.render('cursos', { cursos: resultados });
    });
});

app.get('/agregar/curso', (req, res) => {
    // Realizar consulta a la base de datos para obtener la lista de cursos
    connection.query('SELECT * FROM profesores', (error, resultados) => {
        if (error) {
            console.error('Error al obtener la lista de profesores: ', error);
            return;
        }
        res.render('agregarC', { profesores: resultados });
    });
});

// Agregar un nuevo curso
app.post('/agregar/curso', (req, res) => {
    const { nombre_curso, duracion, aula, id_profesor } = req.body;
    const consulta = 'INSERT INTO cursos (nombre_curso, duracion, aula, id_profesor) VALUES (?, ?, ?, ?)';
    connection.query(consulta, [nombre_curso, duracion, aula, id_profesor], (error, results) => {
        if (error) {
            console.error('Error al insertar el curso: ', error);
            return;
        }
        const id_curso = results.insertId;

        // Ahora, almacenamos esta relación en la tabla de inscripciones
        const consultaInscripcion = 'INSERT INTO inscripciones (id_curso, id_profesor) VALUES (?, ?)';
        connection.query(consultaInscripcion, [id_curso, id_profesor], (errorInscripcion, resultsInscripcion) => {
            if (errorInscripcion) {
                console.error('Error al insertar la inscripción: ', errorInscripcion);
                return;
            }

            console.log('Curso insertado exitosamente junto con la inscripción');
            res.redirect('/curso');
        });
    });
});

// Obtener datos de un curso para editar
app.get('/editar/curso/:id', (req, res) => {
    const id = req.params.id;
    connection.query('SELECT * FROM cursos WHERE id = ?', [id], (error, resultado) => {
        if (error) {
            console.error('Error al obtener el curso para editar: ', error);
            return;
        }
        res.render('editarC', { curso: resultado[0] });
    });
});

// Actualizar datos de un curso
app.post('/actualizar/curso/:id', (req, res) => {
    const { nombre, duracion, aula } = req.body;
    const id = req.params.id;
    const consulta = 'UPDATE cursos SET nombre_curso = ?, duracion = ?, aula = ? WHERE id = ?';
    connection.query(consulta, [nombre, duracion, aula, id], (error, results) => {
        if (error) {
            console.error('Error al actualizar el curso: ', error);
            return;
        }
        console.log('Curso actualizado exitosamente');
        res.redirect('/curso');
    });
});

// Eliminar un curso
app.post('/eliminar/curso/:id', (req, res) => {
    const id = req.params.id;
    connection.query('DELETE FROM cursos WHERE id = ?', [id], (error, results) => {
        if (error) {
            console.error('Error al eliminar el curso: ', error);
            return;
        }
        console.log('Curso eliminado exitosamente');
        res.redirect('/curso');
    });
});

app.get('/profesor', (req, res) => {
    connection.query('SELECT * FROM profesores', (error, resultados) => {
        if (error) {
            console.error('Error al obtener los profesores: ', error);
            return;
        }
        res.render('profesor', { profesores: resultados });
    });
});

app.get('/agregar/profesor', (req, res) => {
    connection.query('SELECT * FROM profesores', (error, resultados) => {
        if (error) {
            console.error('Error al obtener la lista de profesores: ', error);
            return;
        }
        res.render('agregarP');
    });
});

app.post('/agregar/profesor', (req, res) => {
    const { nombre, email, telefono } = req.body;
    const consulta = 'INSERT INTO profesores (nombre, email, telefono) VALUES (?, ?, ?)';
    connection.query(consulta, [nombre, email, telefono], (error, results) => {
        if (error) {
            console.error('Error al insertar el profesor: ', error);
            return;
        }
        console.log('Profesor insertado exitosamente');
        res.redirect('/profesor');
    });
});

app.get('/editar/profesor/:id', (req, res) => {
    const id = req.params.id;
    connection.query('SELECT * FROM profesores WHERE id = ?', [id], (error, resultado) => {
        if (error) {
            console.error('Error al obtener el profesor para editar: ', error);
            return;
        }
        res.render('editarP', { profesor: resultado[0] });
    });
});

app.post('/actualizar/profesor/:id', (req, res) => {
    const { nombre, email, telefono } = req.body;
    const id = req.params.id;
    const consulta = 'UPDATE profesores SET nombre = ?, email = ?, telefono = ? WHERE id = ?';
    connection.query(consulta, [nombre, email, telefono, id], (error, results) => {
        if (error) {
            console.error('Error al actualizar el profesor: ', error);
            return;
        }
        console.log('Profesor actualizado exitosamente');
        res.redirect('/profesor');
    });
});

app.post('/eliminar/profesor/:id', (req, res) => {
    const id = req.params.id;
    connection.query('DELETE FROM profesores WHERE id = ?', [id], (error, results) => {
        if (error) {
            console.error('Error al eliminar el profesor: ', error);
            return;
        }
        console.log('Profesor eliminado exitosamente');
        res.redirect('/profesor');
    });
});


app.get('/inscripciones', (req, res) => {
    // Realizar una consulta para obtener los datos de inscripciones desde la base de datos
    const query = `
        SELECT alumnos.nombre AS nombre_alumno, cursos.nombre_curso AS nombre_curso, profesores.nombre AS nombre_profesor
        FROM inscripciones
        INNER JOIN alumnos ON inscripciones.id_alumno = alumnos.id
        INNER JOIN cursos ON inscripciones.id_curso = cursos.id
        INNER JOIN profesores ON cursos.id_profesor = profesores.id
    `;

    connection.query(query, (error, resultados) => {
        if (error) {
            console.error('Error al obtener las inscripciones: ', error);
            return;
        }
        res.render('inscripciones', { inscripciones: resultados });
    });
});

app.listen(port, () => {
    console.log(`Servidor en ejecución en http://localhost:${port}`);
});

