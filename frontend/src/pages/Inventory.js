import Layout from "../components/Layout.";
import styled from "styled-components";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faPen, faPencilAlt } from "@fortawesome/free-solid-svg-icons";
import Input from "../components/Input/Input";
import Button from "../components/Button";

import { useState, useEffect} from 'react';
import { getItems, updateItem, deleteItem, insertItem, SP_API } from "../utils/SP_APPI";
import Modal from "../components/Modal/Modal";
import useModal from "../hooks/useModal";
import Keypad from "../components/Keypad";


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

export default function Inventory(){
    const [tableData, setTableData] = useState(null);
    const { modalState, setModalState, handleModalClose } = useModal();
    const { modalState: editModalState, setModalState: setEditModalState, handleModalClose: handleEditModalClose } = useModal();
    const [ currentNumber, setCurrentNumber ] = useState('');
    const [ currentItem, setCurrentItem] = useState('');

    const fields = ['Nombre', 'Total', 'Merma/ Actualizar stock'];

    const initialFunction = async () => {
        let res = await getItems('stock');
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
            console.log(r);
            setTableData(r);
            console.log(res);
        }
    };

    const openMermaModal = data => {
        setModalState({visible: true});
    };

    
    const openEditModal = data => {
        setEditModalState({visible: true});
    };

    const applyMerma = async evt => {
        evt.preventDefault();
        let merma = Number(evt.target.merma.value);
        let producto = Number(evt.target.product_id.value);

        let data = {merma, producto};
        console.log(data);
        
        let res = await SP_API('http://localhost:3002/merma', 'POST', data);
        console.log(res);
        if(res.error === false){
            window.location.reload();
        }

        else{
            alert('Error al realizar la merma');
        }
        console.log('merma');
    }

    const updateStock = async evt => {
        evt.preventDefault();
        let new_stock = Number(evt.target.new_stock.value);
        let producto = Number(evt.target.product_id.value);
        let current_stock = Number(evt.target.current_stock.value);

        let new_shopping = new_stock - current_stock;

        let data = {
            product_id: producto,
            kg: new_shopping,
            date: null,
            supplier_id: 1,
        };
        console.log(data);

        let res = await insertItem('compra', data);
        if(res.err === false){
            evt.target.reset(); 
            initialFunction()
            handleEditModalClose(); 
        }

        else{
            alert('Error al actualizar compra');
        }

    }

    useEffect( () => {
        initialFunction();
    }, []);

    return(
        <Layout active='Inventario'>
            <Container>
                <h2>INVENTARIO</h2>
                
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
                                        <td>{ item.nombre }</td>
                                        <td>{ Math.round(((item.total_compras ? item.total_compras : 0) - (item.total_pedidos ? item.total_pedidos: 0) - (item.total_merma ? item.total_merma: 0)) *100 )/100 } {item.venta_por} </td>
                                        <td style={ {display: 'flex'} }>
                                            <Button className="bg-red" onClick={ () => { openMermaModal(item); setCurrentItem(item) } }><FontAwesomeIcon icon={faTimes} /> Merma</Button>
                                            <Button ml className="bg-blue" onClick={ () => { openEditModal(item); setCurrentItem(item) } }><FontAwesomeIcon icon={faPencilAlt} /> Editar stock</Button>
                                        </td>
                                    </tr>
                                })
                            : null}
                        </tbody>
                    </StyledTable>
                </div>
            </Container>

            <Modal title='Mi titulo2' visible={ modalState.visible }  handleModalClose={  () => { handleModalClose(); setCurrentNumber('') } } >
            <div className="product-card-modal">

                <p>¿De verdad desea realizar una merma al producto <strong style={ {fontSize: 16}}>{ currentItem ? currentItem.nombre: null}</strong>?</p>

                <form className="modal-form" onSubmit={ applyMerma }>
                    <input type='hidden' name='product_id' defaultValue={ currentItem ? currentItem.id : null } required/>
                    <PaymentAmount>Stock actual: {Math.round(((currentItem.total_compras ? currentItem.total_compras : 0) - (currentItem.total_pedidos ? currentItem.total_pedidos: 0) - (currentItem.total_merma ? currentItem.total_merma: 0)) *100 )/100 } { currentItem ? currentItem.venta_por : null}</PaymentAmount>

                    <PaymentAmount>Merma: { currentNumber ? currentNumber : '0'} { currentItem ? currentItem.venta_por : null}</PaymentAmount>
                    <input type='hidden' value={currentNumber ? currentNumber : '0'} name='merma'/>
                    <Keypad currentNumber={currentNumber} setCurrentNumber={setCurrentNumber} />

                    <div className="modal-buttons" style={ {marginTop: 20} }>
                        <Button type='submit' className="bg-primary" >Confirmar</Button>
                        <Button type='button' className="bg-red" onClick={ () => { handleModalClose(); setCurrentNumber('') } }>Cancelar</Button>
                    </div>
                </form>
                </div>
            </Modal>


            <Modal title='' visible={ editModalState.visible }  handleModalClose={  () => { handleEditModalClose(); setCurrentNumber('') } } >
            <div className="product-card-modal">

                <p>Actualizar stock del producto <strong style={ {fontSize: 16}}>{ currentItem ? currentItem.nombre: null}</strong></p>

                <form className="modal-form" onSubmit={ updateStock }>
                    <input type='hidden' name='product_id' defaultValue={ currentItem ? currentItem.id : null } required/>
                    <PaymentAmount>{ currentNumber ? currentNumber : '0'} { currentItem ? currentItem.venta_por : null} </PaymentAmount>
                    <input type='hidden' value={ tableData ? Math.round(((currentItem.total_compras ? currentItem.total_compras : 0) - (currentItem.total_pedidos ? currentItem.total_pedidos: 0) - (currentItem.total_merma ? currentItem.total_merma: 0)) *100 )/100 : 0} name='current_stock'/>
                    <input type='hidden' value={currentNumber ? currentNumber : '0'} name='new_stock'/>
                    <Keypad currentNumber={currentNumber} setCurrentNumber={setCurrentNumber} />
                    <div className="modal-buttons" style={ {marginTop: 20} }>
                        <Button type='submit' className="bg-primary" >Si, actualizar stock</Button>
                        <Button type='button' className="bg-red" onClick={ () => { handleEditModalClose(); setCurrentNumber('') } }>Cancelar</Button>
                    </div>
                </form>
                </div>
            </Modal>
        </Layout>
    );
}