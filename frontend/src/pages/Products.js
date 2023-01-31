import Layout from "../components/Layout.";
import styled from "styled-components";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faPen, faPlus } from "@fortawesome/free-solid-svg-icons";
import Input, { InputFile } from "../components/Input/Input";
import Button from "../components/Button";
import Keypad from "../components/Keypad";

import { useState, useRef, useEffect} from 'react';
import { getItems, updateItem, deleteItem } from "../utils/SP_APPI";
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

const PaymentAmount = styled.p` 
    font-size: 36px;
    font-weight: 600;
    text-align: center;
`;

const Total = styled.p` 
    font-size: 36px;
    text-align: center;
    margin-bottom: 0px;
    margin-top: 0px;
`;

export default function Productos(){
    const [currentUserImg, setCurrentUserImg] = useState('');
    const [tableData, setTableData] = useState(null);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [ currentNumber, setCurrentNumber ] = useState('');

    const { modalState, setModalState, handleModalClose } = useModal();
    const { modalState: pictureModalState, setModalState: setPictureModalState, handleModalClose: handlePictureModalClose } = useModal();
    const { modalState: priceModalState, setModalState: setPriceModalState, handleModalClose: handlePriceModalClose } = useModal();
    
    const [ errorMsj, setErrorMsj ] = useState('');

    const userImgRef = useRef();
    const fileTypes = ['image/png', 'image/jpg', 'image/jpeg'];
    const fields = ['Imagen', 'Nombre', 'Precio', 'Venta por', 'Eliminar', 'Modificar'];
    
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
    
    const initialFunction = async () => {
        let res = await getItems('Productos');

        
        function compare( a, b ) {
            if ( a.name.toLowerCase() < b.name.toLowerCase() ){
              return -1;
            }

            if ( a.name.toLowerCase() > b.name.toLowerCase() ){
              return 1;
            }
            return 0;
        }
          
        let r = res.sort( compare );

        console.log(r);
        setTableData(r);
    };
    
    const openEditModal = product_data => {
        setCurrentProduct(product_data);
        setPriceModalState({visible: true});
    };

    const updateProduct = async evt => {
        evt.preventDefault();
        let data = {
            price: evt.target.price.value,
            product_id: evt.target.product_id.value,
        };

        if(Number(data.price) > 0){
            handlePriceModalClose();

            let res = await updateItem('producto', data);
            if(res.err === false){
                initialFunction();    
            }
    
            else{
                alert('Error al actualizar el producto');
            }

            setCurrentNumber('');
        }
    };

    const editModal = item_data => {
        return <div className="product-card-modal">

        <p>Editar datos de <strong style={ {fontSize: 16}}>{ item_data.name}</strong></p>

        <form className="modal-form" onSubmit={ updateProduct }>
            <input type='hidden' name='product_id' required defaultValue={item_data.id} /> 
            <Input placeholder='Nombre' label='Nombre' name='name' required defaultValue={item_data.name} /> 
            <Input placeholder='Precio' label='Precio' name='price' required defaultValue={item_data.price} /> 
            <label>
                <p style={{ fontSize: 26, fontWeight: 600}}>Venta por</p>
                <select name="venta_por" style={{fontSize: 26}} defaultValue={item_data.venta_por}>
                    <option value='kg'>kg</option>
                    <option value='pza'>pza</option>
                </select>
            </label>
            <div className="modal-buttons" style={{marginTop: 20}}>
                <Button className="bg-primary" type='submit'>Guardar</Button>
                <Button className="bg-red" onClick={ handleModalClose }>Cancelar</Button>
            </div>
        </form>
    </div>
    };

    const deleteProduct = async evt => {
        let product_id = evt.target.product_id.value;
        
        
        handleModalClose();

        let res = await deleteItem('producto', product_id);
        if(res.err === false){
            initialFunction();    
        }

        else{
            alert('Error al eliminar el producto');
        }
    }

    const openDeleteModal = product_data => {
        setModalState({visible: true, content: deleteModal(product_data)});
    };

    const deleteModal = item_data => {
        return <div className="product-card-modal">

        <p>¿De verdad desea eliminar <strong style={ {fontSize: 16}}>{ item_data.name}</strong>?</p>

        <form className="modal-form" onSubmit={ deleteProduct }>
            <input type='hidden' name='product_id' defaultValue={ item_data.id } required/>
            <div className="modal-buttons" style={ {marginTop: 20} }>
                <Button className="bg-red" >Si, eliminar</Button>
                <Button type='submit' onClick={ handleModalClose }>Cancelar</Button>
            </div>
        </form>
    </div>
    };


    const validateProduct = evt =>{
        evt.preventDefault();
        setErrorMsj('');
        if(evt.target.nombre.value && evt.target.precio.value){
            if(evt.target.nombre.value.length <= 13){
                let product = evt.target.nombre.value;
                let product_exists = tableData.find( produ => produ.name.toLowerCase() === product.toLowerCase());
                if(product_exists){
                    setErrorMsj('Error. Nombre del producto ya existe.');
                    return null;
                }
                evt.target.action="http://localhost:3002/nuevo-producto";
                evt.target.method="post";
                evt.target.submit();
            }

            else{
                setErrorMsj('Error. El nombre del producto no debe ser mayor a 13 caracteres.');
            }

        }
        else{
            setErrorMsj('Error. Favor de completar todos los campos.');
        }
    }

    useEffect( () => {
        initialFunction();
    }, []);

    return(
        <Layout active='Productos'>
            <Container>
                <h2>NUEVO PRODUCTO</h2>

                <form onSubmit={ validateProduct } encType="multipart/form-data" style={ {fontSize: 26} }>

                    <Button type="button" onClick={ () => setPictureModalState({...pictureModalState, visible: true})} className="bg-blue"><FontAwesomeIcon icon={ faPlus } size={'lg'} /> Agregar foto</Button>
                    <Modal title='' visible={ pictureModalState.visible }  handleModalClose={  handlePictureModalClose } >
                        <div style={ {display: 'flex', flexDirection: 'column', jusifyContent: 'center', alignItems: 'center'} }>
                            <div ref={userImgRef} className='user-profile-preview rounded-full m-auto shadow-lg' style={ {width: 150, height:150, borderRadius: 100, border: 'solid 2px #000'} }></div>
                            <InputFile  name='foto' placeholder='Foto' onChange={ handleOnChangePhoto } />
                            <Button type="button" style={ {marginTop: 20} } onClick={ handlePictureModalClose } className="bg-primary">Cerrar ventana</Button>
                        </div>
                    </Modal>

                    <StyledInput type='text' placeholder='Nombre' label='Nombre' name='nombre'/>
                    <StyledInput type='number' max='99999.99' placeholder='Precio' step={'.01'} label='Precio' name='precio'/>

                    <label>
                        <p style={ {fontWeight: 600, marginBottom: 5} }>Venta por</p>
                        <select name="venta_por" style={{fontSize: 26}}>
                            <option value='kg'>kg</option>
                            <option value='pza'>pza</option>
                        </select>
                    </label>
                    
                    <p style={ {color: 'red'} }>{ errorMsj }</p>
                    
                    <ButtonGroup>
                        <ControlButton type='submit' className="bg-primary">GUARDAR</ControlButton>
                        <ControlButton type='reset' className="bg-red" >CANCELAR</ControlButton>
                    </ButtonGroup>
                </form>

                <h2>LISTA DE PRODUCTOS</h2>

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
                                        <td><img src={ item.img }  style={ {maxWidth: 90} }/></td>
                                        <td>{ item.name }</td>
                                        <td>${ item.price }</td>
                                        <td>{ item.venta_por }</td>
                                        <td><Button className="bg-red" onClick={ () => openDeleteModal(item) }><FontAwesomeIcon icon={faTimes} /> Eliminar</Button> </td>
                                        <td><Button className="bg-blue" onClick={ () => openEditModal(item) }><FontAwesomeIcon icon={faPen} /> Editar precio</Button> </td>
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


            { /* Edit price modal */}
            <Modal title='Mi titulo' visible={ priceModalState.visible }  handleModalClose={  handlePriceModalClose } >
                <div className="product-card-modal">
                    { currentProduct ? 
                    <>
                        <p>Editar precio de <strong style={ {fontSize: 16}}>{ currentProduct.name}</strong></p>

                        <form className="modal-form" onSubmit={ updateProduct }>
                            <input type='hidden' name='product_id' required defaultValue={currentProduct.id} />
                            <input type='hidden' name='price' required value={ currentNumber } /> 
                            <Total>Precio anterior: <strong style={{ fontSize: 36}}>${ currentProduct.price } </strong></Total>

                            <Total style={ {margin: '20px auto 40px auto'} }>Nuevo precio: <strong style={{ fontSize: 36}}>${ currentNumber ? currentNumber : '0'} </strong></Total>

                            <Keypad currentNumber={currentNumber} setCurrentNumber= { (val) => {setCurrentNumber(val); }} />

                            <div className="modal-buttons" style={{marginTop: 20}}>
                                <Button className="bg-primary" type='submit'>Guardar</Button>
                                <Button type='button' className="bg-red" onClick={ handlePriceModalClose }>Cancelar</Button>
                            </div>
                        </form>
                    </>
                    : null }
                </div>
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

                    `
                }
            </style>
        </Layout>
    );
}