import Layout from "../components/Layout.";
import styled from "styled-components";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faPen } from "@fortawesome/free-solid-svg-icons";
import Input, { InputFile } from "../components/Input/Input";
import Button from "../components/Button";
import { SP_API } from "../utils/SP_APPI";

import { useState, useRef, useEffect} from 'react';
import { getItems, updateItem, deleteItem, insertItem } from "../utils/SP_APPI";
import Modal from "../components/Modal/Modal";
import useModal from "../hooks/useModal";

const Container = styled.div`
    padding: 20px;
`;

const StyledInput = styled(Input)`
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
export default function Clientes(){
    const [tableData, setTableData] = useState(null);
    const [currentUserImg, setCurrentUserImg] = useState('');
    const {modalState, setModalState, handleModalClose } = useModal();
    const [filters, setFilters] = useState({id: null, nombre: null, telefono: null});
    const [username, setUsername] = useState(null);
    const [error, setError] = useState('');
    const [ errorMsj, setErrorMsj ] = useState('');

    const userImgRef = useRef();
    const fileTypes = ['image/png', 'image/jpg', 'image/jpeg'];
    const fields = ['Id', 'Nombre', 'Telefono','Eliminar', 'Modificar'];
    
    const initialFunction = async () => {
        let res = await getItems('clientes');
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

    const handleOnChangePhoto = (evt) => {
        console.log(evt.target.files);
        if(evt.target.files.length > 0){
            let file = evt.target.files[0];
            console.log(file);
            if(fileTypes.includes(file.type)){
                let fr = new FileReader()
                if(fr){
                    fr.readAsDataURL(file);
                }
    
                fr.onloadend = ()  => {
                    //console.log(fr.result);
                    setCurrentUserImg(fr.result);
                }
            }
            else{
                alert('Tipo de archivo no permitido');
            }
        }
    };

    const createClient = async evt =>{
        evt.preventDefault();
        let data = {
            nombre: evt.target.nombre.value,
            telefono: evt.target.telefono.value,
        };

        let res = await insertItem('cliente', data);
        if(res.err === false){
            evt.target.reset(); 
            initialFunction();    
        }

        else{
            alert('Error al actualizar el producto');
        }
    };
    
    const openEditModal = product_data => {
        setModalState({visible: true, content: editModal(product_data)});
    };

    const updateClient = async evt => {
        evt.preventDefault();
        let data = {
            nombre: evt.target.nombre.value,
            telefono: evt.target.telefono.value,
            client_id: evt.target.client_id.value
        };

        if(data.nombre.length > 0 && data.telefono.length === 10){
            handleModalClose();

            let res = await updateItem('cliente', data);
            if(res.err === false){
                initialFunction();    
            }
    
            else{
                alert('Error al actualizar el cliente');
            }
        }
    };

    const editModal = item_data => {
        return <div className="product-card-modal">

        <p>Editar datos de <strong style={ {fontSize: 16}}>{ item_data.nombre }</strong></p>

        <form className="modal-form" onSubmit={ updateClient } style={ {fontSize: '26px'} } >
            <input type='hidden' name='client_id' required defaultValue={item_data.id} /> 
            <Input placeholder='Nombre' label='Nombre' name='nombre' required defaultValue={item_data.nombre} /> 
            <Input placeholder='Teléfono' label='Teléfono' name='telefono' type='number' required defaultValue={item_data.telefono} /> 
            <div className="modal-buttons">
                <Button className="bg-primary" type='submit'>Guardar</Button>
                <Button className="bg-red" onClick={ handleModalClose }>Cancelar</Button>
            </div>
        </form>
    </div>
    };

    const deleteClient = async evt => {
        evt.preventDefault();
        let client_id = evt.target.client_id.value;
        
        handleModalClose();

        let res = await deleteItem('cliente', client_id);
        if(res.err === false){
            initialFunction();    
        }

        else{
            alert('Error al eliminar el cliente');
        }
    }

    const openDeleteModal = product_data => {
        setModalState({visible: true, content: deleteModal(product_data)});
    };

    const deleteModal = item_data => {
        return <div className="product-card-modal">

        <p>¿De verdad desea eliminar a <strong style={ {fontSize: 16}}>{ item_data.nombre}</strong>?</p>

        <form className="modal-form" onSubmit={ deleteClient }>
            <input type='hidden' name='client_id' defaultValue={ item_data.id } required/>
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
    
    const checkClientName = async evt => {
        evt.preventDefault();
        setError('');
        if(evt.target.nombre.value && evt.target.telefono.value){
            let username = evt.target.nombre.value;
            let user_exist = tableData.find( client => client.nombre.toLowerCase() === username.toLowerCase());
            if(user_exist){
                setError('Error. Nombre del cliente ya existe, favor de agregar apellidos u otra palabra al cliente.');
            }
    
            else{
                if(evt.target.telefono.value.length === 10){
                    let client_data = {
                        nombre: evt.target.nombre.value,
                        telefono: evt.target.telefono.value
                    }
            
                    let res = await SP_API('http://localhost:3002/nuevo-cliente', 'POST', client_data); 
            
                    if(res.error === false){
                        window.location.reload();
                    }
                    // evt.target.action="http://localhost:3002/nuevo-cliente";
                    // evt.target.method="post";
                    // evt.target.submit();
                }
                else{
                    setError('Error. El telefono debe de tener 10 digitos');
                }
            }
        }
        else{
            setError('Error. Favor de completar todos los campos.');
        }
    }

    function filterData(){
        return tableData.filter( item => {
            // Filter by date
            if(filters.id)
                return Number(item.id) === Number(filters.id);
            else
                return item;	
        }).
        filter( item => {
            // Filter by client
            if(filters.nombre)
                if(filters.nombre)
                    return item.nombre.toLowerCase().includes(filters.nombre.toLowerCase())
            return item;
        }).
        filter( item => {
            // Filter by chalan
            if(filters.telefono)
                if(filters.telefono)
                    return item.telefono.includes(filters.telefono)
            return item;
        })
    }

    return(
        <Layout active='Clientes'>
            <Container>
                <h2>NUEVO CLIENTE</h2>
                <form onSubmit={ checkClientName } style={ {fontSize: 26} }>
                    <StyledInput type='text' placeholder='Nombre' label='Nombre' name='nombre' required/>
                    <StyledInput type='number' max='9999999999' placeholder='Teléfono' label='Teléfono' name='telefono'/>
                    <p style={ {color: '#ff0000'} } > { error } </p>
                    
                    <p style={ { color: 'red'} }>{ errorMsj }</p>
                    <ButtonGroup>
                        <ControlButton type='submit' className="bg-primary">GUARDAR</ControlButton>
                        <ControlButton type='reset' onClick={ () => setError('') } className="bg-red" >CANCELAR</ControlButton>
                    </ButtonGroup>
                </form>

                <h2>LISTA DE CLIENTES</h2>


                <div style={ { overflowX: 'auto'}}>
                    <StyledTable>
                        <thead>
                            <tr>
                                <td><input placeholder='Id' type={'text'} style={ {padding: 10, fontSize: '18px'} } onChange={ (event) => setFilters({...filters, id: event.target.value }) }/> </td>
                                <td><input placeholder='Nombre' type={'text'} style={ {padding: 10, fontSize: '18px'} } onChange={ (event) => setFilters({...filters, nombre: event.target.value }) }/> </td>
                                <td><input placeholder='Teléfono' type={'text'} style={ {padding: 10, fontSize: '18px'} } onChange={ (event) => setFilters({...filters, telefono: event.target.value }) }/> </td>
                                <td>Eliminar</td>
                                <td>Modificar</td>
                            </tr>
                        </thead>

                        <tbody>
                            { tableData ? 
                                filterData().map( (item, index) => {
                                    return <tr key={index}>
                                        <td>{ item.id }</td> 
                                        <td>{ item.nombre }</td>
                                        <td>{ item.telefono }</td>
                                        <td><Button className="bg-red" onClick={ () => openDeleteModal(item) }><FontAwesomeIcon icon={faTimes} /> Eliminar</Button> </td>
                                        <td><Button className="bg-blue" onClick={ () => openEditModal(item) }><FontAwesomeIcon icon={faPen} /> Editar</Button> </td>
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
                        .user-profile-preview{
                            background-image: url('${currentUserImg}');
                            background-repeat: no-repeat;
                            background-size: cover;
                            backgorund-position: center;
                        }

                        .user-profile-img{
                            width: 60px;
                            height: 60px;
                            background-size: cover;
                            background-repeat: no-repeat;
                            border-radius: 50%;
                        }

                    `
                }
            </style>
        </Layout>
    );
}