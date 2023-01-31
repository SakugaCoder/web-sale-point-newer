import Layout from "../components/Layout.";
import styled from "styled-components";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faPen } from "@fortawesome/free-solid-svg-icons";
import Input from "../components/Input/Input";
import Button from "../components/Button";

import { useState, useEffect} from 'react';
import { getItems, updateItem, deleteItem, insertItem } from "../utils/SP_APPI";
import Modal from "../components/Modal/Modal";
import useModal from "../hooks/useModal";

const Container = styled.div`
    padding: 20px;
`;

const StyledInput = styled(Input)`
    font-size: 26px;
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

export default function Chalanes(){
    const [tableData, setTableData] = useState(null);
    const { modalState, setModalState, handleModalClose } = useModal();
    const [ errorMsj, setErrorMsj ] = useState('');

    const fields = ['Id', 'Nombre', 'Telefono','Eliminar', 'Modificar'];

    
    
    const initialFunction = async () => {
        let res = await getItems('chalanes');
                
        function compare( a, b ) {
            if ( a.nombre.toLowerCase() < b.nombre.toLowerCase() ){
              return -1;
            }

            if ( a.nombre.toLowerCase() > b.nombre.toLowerCase() ){
              return 1;
            }
            return 0;
        }
          
        
        if(res.err !== true){
            let r = res.sort( compare );
            setTableData(r);
            console.log(r);
        }      
    };

    const createChalan = async evt =>{
        evt.preventDefault();
        let data = {
            nombre: evt.target.nombre.value,
            telefono: evt.target.telefono.value,
        };

        setErrorMsj('');
        if(evt.target.nombre.value && evt.target.telefono.value){
            if(evt.target.telefono.value.length === 10){
                let username = evt.target.nombre.value;
                let user_exist = tableData.find( chalan => chalan.nombre.toLowerCase() === username.toLowerCase());
                if(user_exist){
                    setErrorMsj('Error. Nombre del chalan ya existe, favor de agregar apellidos u otra palabra al nombre.');
                    return null;
                }

                console.log('Creando chalan');
                let res = await insertItem('chalan', data);
                if(res.err === false){
                    evt.target.reset(); 
                    initialFunction();   
                }
        
                else{
                    setErrorMsj('Error al actualizar chalan');
                }
            }

            else{
                setErrorMsj('Error. El telefono debe de tener 10 digitos.');
            }

        }
        else{
            console.log('Error campos incompletos');
            setErrorMsj('Error. Favor de completar todos los campos.');
        }


    };
    
    const openEditModal = data => {
        setModalState({visible: true, content: editModal(data)});
    };

    const updateChalan = async evt => {
        evt.preventDefault();
        let data = {
            nombre: evt.target.nombre.value,
            telefono: evt.target.telefono.value,
            chalan_id: evt.target.chalan_id.value
        };
        
        if(data.telefono.length === 10 && data.nombre.length > 0){
            handleModalClose();

            let res = await updateItem('chalan', data);
            if(res.err === false){
                initialFunction();    
            }
    
            else{
                alert('Error al actualizar chalan');
            }
        }
    };

    const editModal = item_data => {
        return <div className="product-card-modal">

        <p>Editar datos de <strong style={ {fontSize: 16}}>{ item_data.nombre }</strong></p>

        <form className="modal-form" onSubmit={ updateChalan }>
            <input type='hidden' name='chalan_id' required defaultValue={item_data.id} /> 
            <Input placeholder='Nombre' label='Nombre' name='nombre' required defaultValue={item_data.nombre} /> 
            <Input placeholder='Telefono' label='Teléfono' name='telefono' required defaultValue={item_data.telefono} /> 
            <div className="modal-buttons">
                <Button className="bg-primary" type='submit'>Guardar</Button>
                <Button className="bg-red" onClick={ handleModalClose }>Cancelar</Button>
            </div>
        </form>
    </div>
    };


    const deleteChalan = async evt => {
        evt.preventDefault();
        let chalan_id = evt.target.chalan_id.value;
        
        handleModalClose();

        let res = await deleteItem('chalan', chalan_id);
        if(res.err === false){
            initialFunction();    
        }

        else{
            alert('Error al eliminar chalan');
        }
    }


    const openDeleteModal = data => {
        setModalState({visible: true, content: deleteModal(data)});
    };

    const deleteModal = item_data => {
        return <div className="product-card-modal">

        <p>¿De verdad desea eliminar a <strong style={ {fontSize: 16}}>{ item_data.nombre}</strong>?</p>

        <form className="modal-form" onSubmit={ deleteChalan }>
            <input type='hidden' name='chalan_id' defaultValue={ item_data.id } required/>
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
        <Layout active='Chalanes'>
            <Container>
                <h2>NUEVO CHALAN</h2>

                <form onSubmit={ createChalan } style={ {fontSize: '26px'} }>

                    <StyledInput type='text' placeholder='Nombre' label='Nombre' name='nombre' required/>
                    <StyledInput type='number' placeholder='Teléfono' label='Teléfono' name='telefono'/>
                    <p style={ {color: 'red'} }>{ errorMsj }</p>
                    <ButtonGroup>
                        <ControlButton type='submit' className="bg-primary">GUARDAR</ControlButton>
                        <ControlButton type='reset' className="bg-red" >CANCELAR</ControlButton>
                    </ButtonGroup>
                </form>

                <h2>LISTA DE CHALANES</h2>

                <div style={ { overflowX: 'auto'}}>
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

        </Layout>
    );
}