import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RegistroAsistencia.css';

const API = 'http://localhost:8000/registros/';
// const SEARCH_URL = 'http://localhost:8000/buscar-persona/';
const REPORT_URL = 'http://localhost:8000/reporte-excel/';
// const API = 'http://localhost:8000/datos/';


const RegistroAsistencia = () => {
    const [nombre, setNombre] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const [registros, setRegistros] = useState([]);
    const [resumen, setResumen] = useState('');
    const [miniVista, setMiniVista] = useState([]); // ✅ Mini vista para mostrar el último registro

    const fetchData = async () => {
        try {
            const res = await axios.get(API);
            setRegistros(res.data);

            const resumenData = await axios.get('/api/asistencia/', { nombre })
                .catch(() => ({ data: { total_horas_semanales: 'No disponible' } }));
            
            setResumen(resumenData.data.total_horas_semanales);
        } catch (err) {
            setError('Error al cargar datos');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const enviarRegistroAsistencia = async () => {
        setMensaje('');
        setError('');
    
        if (!nombre.trim()) {
            setError('El nombre es obligatorio');
            return;
        }
    
        try {
            const response = await axios.post(API, { nombre });
            setMensaje(response.data.mensaje);
    
            // ✅ Actualiza la tabla con todos los registros
            setRegistros(response.data.registros);
    
            // ✅ Busca el registro específico por el nombre ingresado
            const registroActualizado = response.data.registros.find(
                (registro) => registro.persona_nombre === nombre
            );
    
            // ✅ Si lo encuentra, lo muestra en la mini vista
            if (registroActualizado) {
                setMiniVista([registroActualizado]);
            } else {
                // ✅ Si no lo encuentra, toma el último registro como respaldo
                const ultimoRegistro = response.data.registros.slice(-1)[0];
                setMiniVista([ultimoRegistro]);
            }
    
            setNombre('');
        } catch (error) {
            setError(`Error: ${error.response?.data?.detail || 'Error al registrar'}`);
        }
    };
        
    

    const handleSubmit = (e) => {
        e.preventDefault();
        enviarRegistroAsistencia();
    };

    const descargarExcel = () => {
        window.open(REPORT_URL, '_blank');
    };

    return (
        <div className="container">
            <div className="form-container">
                <h2>Registro de Asistencia</h2>
                <form onSubmit={handleSubmit} className="form">
                    <input
                        type="text"
                        placeholder="Ingresa tu nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="input"
                    />
                    <button type="submit" className="button">Registrar</button>
                </form>

                {mensaje && <p className="success">{mensaje}</p>}
                {error && <p className="error">{error}</p>}

                <button onClick={descargarExcel} className="download-button">
                    Descargar Reporte Excel
                </button>

                <h3 className="resumen">Resumen Semanal: {resumen}</h3>
            </div>

            {/* ✅ Tabla completa */}
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Nit</th>
                            <th>Nombre</th>
                            <th>Departamento</th>
                            <th>Cargo</th>
                            <th>Fecha</th>
                            <th>Hora Entrada</th>
                            <th>Hora Salida</th>
                            {/* <th>Tiempo Trabajado</th> */}
                        </tr>
                    </thead>
                    <tbody>
                        {registros.map((registro) => (
                            <tr key={registro.id}>
                                <td>{registro.NIT}</td>
                                <td>{registro.Nombre}</td>
                                <td>{registro.Nombre_Dependencia}</td>
                                <td>{registro.Nombre_Cargo}</td>
                                <td>{registro.fecha}</td>
                                <td>{registro.hora_entrada}</td>
                                <td>{registro.hora_salida || '-'}</td>
                                {/* <td>{registro.tiempo_trabajado || '---'}</td> */}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ✅ Mini vista solo con el último registro */}

            <div className="mini-vista">
                <h4>Último Registro</h4>
                {miniVista?.length > 0 && miniVista.map((registro) => (
                    <div key={registro.id} className="registro-item">
                        <p><strong>Nombre:</strong> {registro.persona_nombre}</p>
                        <p><strong>Hora Entrada:</strong> {registro.hora_entrada}</p>
                        <p><strong>Hora Salida:</strong> {registro.hora_salida || '-'}</p>
                        <hr />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RegistroAsistencia;
