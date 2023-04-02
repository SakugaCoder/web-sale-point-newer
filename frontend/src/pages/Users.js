import Layout from "../components/Layout.";
import styled from "styled-components";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faPen } from "@fortawesome/free-solid-svg-icons";
import Input from "../components/Input/Input";
import Button from "../components/Button";

import { useState, useEffect} from 'react';
import { getItems, updateItem, deleteItem, insertItem, SP_API } from "../utils/SP_APPI";
import Modal from "../components/Modal/Modal";
import useModal from "../hooks/useModal";

const Container = styled.div`
    padding: 20px;
`;

const StyledInput = styled(Input)`
    background-color: red;
`;

const ButtonGroup = styled.div`
    display: flex;
    justify-content: space-between;

    & button{
        width: 45%;
    }
`;

const ControlButton = styled(Button)`
    width: 100%;
    margin-top: 20px;
    border-radius: 60px;
`;

const StyledTable = styled.table`
    border-collapse: collapse;
    border: 1px solid black;
    width: 100%;
    font-size: 22px;

    tbody tr:nth-child(even) {
        background-color: #eee;
    }

    td{
        padding: 5px;
    }
      
    thead tr {
        background-color: #26C485;
        color: #000;
        text-align: left;
    }
`;

export default function Users(){
    const [tableData, setTableData] = useState(null);
    const { modalState, setModalState, handleModalClose } = useModal();
    const [ errorMsj, setErrorMsj ] = useState('');

    const fields = ['Id','Nombre', 'Rol', 'Acciones'];
    
    const initialFunction = async () => {
        let res = await getItems('usuarios');
        if(res.err !== true){
            function compare( a, b ) {
                if ( a.nombre.toLowerCase() < b.nombre.toLowerCase() ){
                  return -1;
                }

                if ( a.nombre.toLowerCase() > b.nombre.toLowerCase() ){
                  return 1;
                }
                return 0;
            }
              
            let r = res.sort( compare );
            setTableData(r);
            console.log(r);
        }      
    };

    const createUser = async evt =>{
        evt.preventDefault();

        setErrorMsj('');

        if(evt.target.nombre.value.length > 0 && evt.target.pswd.value.length > 0){
            let username = evt.target.nombre.value;
            let user_exist = tableData.find( user => user.nombre.toLowerCase() === username.toLowerCase());
    
            if(user_exist){
                setErrorMsj('Error: Nombre del usuario ya existe, favor de agregar apellidos u otra palabra.');
            }
    
            else{
    
                let data = {
                    nombre: evt.target.nombre.value,
                    rol: Number(evt.target.rol.value),
                    pswd: evt.target.pswd.value
                };
        
                let res = await insertItem('usuario', data);
                if(res.err === false){
                    evt.target.reset(); 
                    initialFunction();   
                }
        
                else{
                    alert('Error al actualizar usuario');
                }
            }
        }

        else{
            setErrorMsj('Error. Favor de completar todos los campos.');
        }
    };
    
    const openEditModal = data => {
        setModalState({visible: true, content: editModal(data)});
    };

    const openPasswordModal = data => {
        setModalState({visible: true, content: passwordModal(data)});
    };

    const updateUser = async evt => {
        evt.preventDefault();
        let data = {
            rol: evt.target.rol.value,
            user_id: evt.target.user_id.value
        };

        handleModalClose();

        let res = await updateItem('usuario', data);
        if(res.err === false){
            initialFunction();    
        }

        else{
            alert('Error al actualizar usuario');
        }   
        
    };

    const changePassword = async evt => {
        evt.preventDefault();
        setErrorMsj('');
        if(evt.target.pass.value){
            console.log('pass filled')
            let data = {
                user_id: evt.target.user_id.value,
                pass: evt.target.pass.value
            };
            
            handleModalClose();
    
            let res = await SP_API('http://localhost:3002/cambiar-password-usuario', 'post', data);
            if(res.err === false){
                initialFunction();    
            }
    
            else{
                alert('Error al editar usuario');
            }
        }

        else{
            // setErrorMsj('Error. Favor de ingresar nueva contraseña.');
            console.log('error pass not filled');
            // setErrorMsj('Error. Contraseñas no coinciden');
        }
    };

    const editModal = item_data => {
        return <div className="product-card-modal">

        <p>Editar datos de <strong style={ {fontSize: 16}}>{ item_data.nombre }</strong></p>

        <form className="modal-form" onSubmit={ updateUser }>
            <input type='hidden' name='user_id' required defaultValue={item_data.id} /> 
            <label style={ {marginBottom: 20} }>
                <p style={ {fontSize: 26} }>Rol</p>
                <select name="rol" defaultValue={'' + item_data.rol } style={ {fontSize: 26} }>
                    <option value="0">Usuario</option>
                    <option value="1" selected>Administrador</option>
                </select>
            </label>
            <div className="modal-buttons">
                <Button className="bg-primary" type='submit'>Guardar</Button>
                <Button className="bg-red" onClick={ handleModalClose }>Cancelar</Button>
            </div>
        </form>
    </div>
    };

    const passwordModal = item_data => {
        return <div className="product-card-modal">

        <p>Editar contraseña de <strong style={ {fontSize: 16}}>{ item_data.nombre }</strong></p>

        <form className="modal-form" onSubmit={ changePassword }>
            <input type='hidden' name='user_id' required defaultValue={item_data.id} /> 
            <Input placeholder='Nueva contraseña' label='Nueva contraseña' name='pass' /> 
            
            <div className="modal-buttons">
                <Button className="bg-primary" type='submit'>Cambiar contraseña</Button>
                <Button className="bg-red" onClick={ handleModalClose }>Cancelar</Button>
            </div>
        </form>
    </div>
    };


    const deleteUser = async evt => {
        evt.preventDefault();
        let user_id = evt.target.user_id.value;
        
        handleModalClose();

        let res = await deleteItem('usuario', user_id);
        if(res.err === false){
            initialFunction();    
        }

        else{
            alert('Error al eliminar proveedor');
        }
    }

    const openDeleteModal = data => {
        setModalState({visible: true, content: deleteModal(data)});
    };

    const deleteModal = item_data => {
        return <div className="product-card-modal">

        <p>¿De verdad desea eliminar a <strong style={ {fontSize: 16}}>{ item_data.nombre}</strong>?</p>

        <form className="modal-form" onSubmit={ deleteUser }>
            <input type='hidden' name='user_id' defaultValue={ item_data.id } required/>
            <div className="modal-buttons" style={ {marginTop: 20} }>
                <Button className="bg-red" >Si, eliminar</Button>
                <Button type='submit' onClick={ handleModalClose }>Cancelar</Button>
            </div>
        </form>
    </div>
    };

    useEffect( () => {
        initialFunction();
    }, []);


    return(
        <Layout active='Usuarios'>
            <Container>
                <h2>NUEVO USUARIO</h2>

                <form onSubmit={ createUser }>

                    <StyledInput type='text' placeholder='Nombre' label='Nombre' name='nombre' required/>
                    <StyledInput type='text' placeholder='Contraseña' label='Contraseña' name='pswd' required/>
                    <label>
                        <p style={ {fontSize: 26, marginBottom: 10} }>Rol</p>
                        <select name="rol" style={ {fontSize: 26} }>
                            <option value="0">Usuario</option>
                            <option value="1">Administrador</option>
                        </select>
                    </label>

                    <p style={ { color: 'red', fontSize: 26} }>{ errorMsj }</p>


                    <ButtonGroup>
                        <ControlButton type='submit' className="bg-primary">GUARDAR</ControlButton>
                        <ControlButton type='reset' className="bg-red" >CANCELAR</ControlButton>
                    </ButtonGroup>
                </form>

                <h2>LISTA DE USUARIOS</h2>

                <div style={ { overflowX: 'auto', overflowY: 'auto', maxHeight: '40vh'}}>
                    <StyledTable>
                        <thead>
                            <tr>
                                { fields.map( (item, index) => <td key={index}> { item} </td>)}
                            </tr>
                        </thead>

                        <tbody>
                            { tableData ? 
                                tableData.map( (item, index) => {
                                    return <tr key={index}>
                                        <td>{ item.id }</td>
                                        <td>{ item.nombre }</td>
                                        <td>{ item.rol === 1 ? 'Administrador' : 'Usuario' }</td>
                                        <td style={ {display: 'flex'} }>
                                            <Button className="bg-red" onClick={ () => openDeleteModal(item) }><FontAwesomeIcon icon={faTimes} /> Eliminar</Button>
                                            <Button className="bg-blue" ml onClick={ () => openEditModal(item) }><FontAwesomeIcon icon={faPen} /> Editar</Button>
                                            <Button className="bg-light-blue" ml onClick={ () => openPasswordModal(item) }><FontAwesomeIcon icon={faPen} /> Cambiar contraseña</Button>
                                        </td>
                                    </tr>
                                })
                            : null}
                        </tbody>
                    </StyledTable>
                </div>
            </Container>

            <Modal title='Mi titulo' visible={ modalState.visible }  handleModalClose={  handleModalClose } >
                { modalState.content }
            </Modal>

            <style>
                {
                    `
                        label p{
                            font-weight: 600;
                        }

                        select{
                            padding: 5px;
                        }
                    `
                }
            </style>

        </Layout>
    );
}