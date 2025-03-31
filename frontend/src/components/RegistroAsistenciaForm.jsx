import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RegistroAsistencia.css';

const API = 'http://localhost:8000/registros/';
const SEARCH_URL = 'http://localhost:8000/buscar-persona/';
const REPORT_URL = 'http://localhost:8000/reporte-excel/';

const RegistroAsistencia = () => {
    const [nit, setNit] = useState('');
    const [nombre, setNombre] = useState('');
    const [dependencia, setDependencia] = useState('');
    const [cargo, setCargo] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const [registros, setRegistros] = useState([]);
    const [resumen, setResumen] = useState('');
    const [miniVista, setMiniVista] = useState([]);

    // ✅ Cargar datos iniciales
    const fetchData = async () => {
        try {
            const res = await axios.get(API);
            setRegistros(res.data);

            const resumenData = await axios.get('/api/asistencia/')
                .catch(() => ({ data: { total_horas_semanales: 'No disponible' } }));

            setResumen(resumenData.data.total_horas_semanales);
        } catch (err) {
            setError('Error al cargar datos');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // ✅ Buscar automáticamente cuando cambia el valor de `nit`
    useEffect(() => {
        if (nit) {
            buscarPersona(nit);
        }
    }, [nit]);

    // ✅ Buscar información por NIT (Ahora usa 'NIT' en mayúsculas)
    const buscarPersona = async (nit) => {
        if (!nit.trim()) {
            setError('El NIT es obligatorio');
            return;
        }

        try {
            const response = await axios.get(`${SEARCH_URL}`, { params: { NIT: nit } }); // ✅ NIT en mayúsculas
            setNombre(response.data.Nombre || '');
            setDependencia(response.data.Dependencia || '');
            setCargo(response.data.Cargo || '');
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Error al buscar información');
            setNombre('');
            setDependencia('');
            setCargo('');
        }
    };

    // ✅ Registrar asistencia (Ahora envía 'NIT' en mayúsculas)
    const enviarRegistroAsistencia = async () => {
        setMensaje('');
        setError('');

        if (!nit.trim()) {
            setError('El NIT es obligatorio');
            return;
        }

        console.log("Datos enviados:", { NIT: nit });

        try {
            const response = await axios.post(API, { NIT: nit }); // ✅ NIT en mayúsculas
            setMensaje(response.data.mensaje);
            setRegistros(response.data.registros);

            // ✅ Mostrar el último registro en la mini vista
            const ultimoRegistro = response.data.registros.slice(-1)[0];
            if (ultimoRegistro) {
                setMiniVista([ultimoRegistro]);
            }

            // ✅ Limpiar campos después de registrar
            setNit('');
            setNombre('');
            setDependencia('');
            setCargo('');
        } catch (error) {
            setError(`Error: ${error.response?.data?.detail || 'Error al registrar'}`);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        enviarRegistroAsistencia();
    };

    // ✅ Descargar reporte en Excel
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
                        placeholder="Ingrese el NIT"
                        value={nit}
                        onChange={(e) => setNit(e.target.value)}
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
                            <th>NIT</th>
                            <th>Nombre</th>
                            <th>Departamento</th>
                            <th>Cargo</th>
                            <th>Fecha</th>
                            <th>Hora Entrada</th>
                            <th>Hora Salida</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registros.map((registro) => (
                            <tr key={registro.NIT || registro.id}>
                                <td>{registro.nit}</td>
                                <td>{registro.persona_nombre}</td>
                                <td>{registro.dependencia}</td>
                                <td>{registro.cargo}</td>
                                <td>{registro.fecha}</td>
                                <td>{registro.hora_entrada}</td>
                                <td>{registro.hora_salida || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ✅ Mini vista solo con el último registro */}
            {miniVista.length > 0 && (
                <div className="mini-vista">
                    <h4>Último Registro</h4>
                    {miniVista.map((registro) => (
                        <div key={registro.id} className="registro-item">
                            {/* <p><strong>NIT:</strong> {registro.nit}</p> */}
                            <p><strong>Nombre:</strong> {registro.persona_nombre}</p>
                            <p><strong>Hora Entrada:</strong> {registro.hora_entrada}</p>
                            <p><strong>Hora Salida:</strong> {registro.hora_salida || '-'}</p>
                            <hr />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RegistroAsistencia;