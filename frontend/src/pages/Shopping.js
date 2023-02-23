import Layout from "../components/Layout.";
import styled from "styled-components";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faPlus } from "@fortawesome/free-solid-svg-icons";
import StyledInput from "../components/Input/Input";
import Button from "../components/Button";
import { SP_API } from "../utils/SP_APPI";

import { useState, useEffect, useMemo} from 'react';
import { useTable, useSortBy } from 'react-table';
import { getItems, updateItem, deleteItem, insertItem } from "../utils/SP_APPI";
import Modal from "../components/Modal/Modal";
import useModal from "../hooks/useModal";
import Keypad from "../components/Keypad";

const Container = styled.div`
    padding: 20px;
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
    th{
        padding: 5px;
    }
      
    thead tr {
        background-color: #26C485;
        color: #000;
        text-align: left;
    }
`;

const ModalButtons = styled.div`
    display: flex;
    justify-content: space-between;
    margin-top: 20px;

    & button{
        width: 45%;
    }
`;

const ModalForm = styled.form`
    width: 100%;

    & label{
        display: block;
        max-width: 100%;
    }

    & label input{
        width: 100%;
        font-size: 18px;
        margin-bottom: 40px;
    }
`;

const Total = styled.p` 
    font-size: 36px;
    text-align: center;
    margin-bottom: 0px;
    margin-top: 0px;
`;

const PaymentAmount = styled.p` 
    font-size: 36px;
    font-weight: 600;
    text-align: center;
`;


const FechaInput = styled.input`
    border: solid 2px #000;
    padding: 10px;
    border-radius: 20px;
    width: 100%;
    font-size: 26px;
    max-width: 300px;
    display: block;
    margin: auto;
`;

export default function Suppliers(){
    const [tableData, setTableData] = useState(null);
    const [products, setProducts] = useState(null);
    const [suppliers, setSuppliers] = useState(null);
    const { modalState, setModalState, handleModalClose } = useModal();
    const { modalState: abonoModalState, setModalState: setAbonoModalState, handleModalClose: handleAbonoModalClose } = useModal();
    const [ errorMsj, setErrorMsj ] = useState('');
    const [filters, setFilters] = useState({fecha: null, proveedor: null, producto: null});
    const [ currentDate, setCurrentDate ] = useState('');
    const [ currentOrder, setCurrentOrder ] = useState();
    const [ estadoCaja, setEstadoCaja ] = useState(null);
    const [ currentNumber, setCurrentNumber] = useState('');

    const fields = ['Producto', 'Kg','Fecha', 'Proveedor', 'Eliminar'];
    
    const initialFunction = async () => {
        let res = await getItems('Compras');
        let res_caja = await getItems('estado-caja');
        if(res.err !== true){
            for(let abono_compra of res){
                if(abono_compra.abono !== abono_compra.costo && abono_compra.id_proveedor !== 1){
                    let abonos_compra = await obtenerAbonos(abono_compra.id);
                    abono_compra.abonos = abonos_compra;
                    console.log(abonos_compra);
                }
            };
            setTableData(res.map( item => {
                return {
                    ...item,
                    eliminar: item
                }
            }));

            console.log(res);
        }

        if(res_caja.caja){
            setEstadoCaja(res_caja);
        }

        let res_products = await getItems('Productos');
        setProducts(res_products);

        let res_suppliers = await getItems('Proveedores');
        setSuppliers(res_suppliers);

        let res_date = await SP_API('http://localhost:3002/date', 'GET');
        setCurrentDate(res_date);
        console.log(res_date);
    };

    const createShopping = async evt =>{
        setErrorMsj('');
        evt.preventDefault();
        let data = {
            product_id: Number(evt.target.product_id.value),
            kg: evt.target.kg.value,
            date: evt.target.date.value,
            supplier_id: Number(evt.target.supplier_id.value),
            costo: Number(evt.target.costo.value),
            // es_retiro: evt.target.es_retiro.checked,
        };

        // if(data.es_retiro){
            // console.log(estadoCaja);
            // if(estadoCaja.caja){
            //     let total = estadoCaja.ingresos - estadoCaja.retiros + estadoCaja.caja.fondo;
            //     if(Number(data.costo) > total){
            //         setErrorMsj('Error. El costo ingresado es mayor al total de la caja.')
            //         return null;
            //     }
    
            //     else if(Number(data.costo) === 0){
            //         setErrorMsj('Error. El costo ingresado es igual a cero, favor de ingresar una cantidad mayor.')
            //         return null;
            //     }
            // }
        // }
        

        if(data.product_id && data.kg && data.date && data.supplier_id && data.costo){
            let detalle_proveedor = suppliers.find( supplier => supplier.id === Number(evt.target.supplier_id.value) );
            let detalle_producto = products.find( product => product.id === Number(evt.target.product_id.value));

            data.detalle_proveedor = detalle_proveedor;
            data.detalle_producto = detalle_producto;

            console.log(data);
            
            let res = await insertItem('compra', data);
            console.log(res);
            if(res.err === false){
                evt.target.reset(); 
                initialFunction();   
            }

            else{
                alert('Error al actualizar compra');
            }
            return;
        }

        setErrorMsj('Error. Favor de completar todos los campos.');


    };

    const deleteShopping = async evt => {
        evt.preventDefault();
        let shopping_id = evt.target.shopping_id.value;
        
        handleModalClose();

        let res = await deleteItem('compra', shopping_id);
        if(res.err === false){
            initialFunction();    
        }

        else{
            alert('Error al eliminar compra');
        }
    }

    const openDeleteModal = data => {
        setModalState({visible: true, content: deleteModal(data)});
    };

    const deleteModal = item_data => {
        return <div className="product-card-modal">

        <p>¿De verdad desea eliminar esta compra?</p>

        <form className="modal-form" onSubmit={ deleteShopping }>
            <input type='hidden' name='shopping_id' defaultValue={ item_data.id } required/>
            <div className="modal-buttons" style={ {marginTop: 20} }>
                <Button className="bg-red" >Si, eliminar</Button>
                <Button type='submit' onClick={ handleModalClose }>Cancelar</Button>
            </div>
        </form>
    </div>
    };


    function filterData(){
        return tableData.filter( item => {
            // Filter by date
            if(filters.fecha)
                return item.fecha === filters.fecha;
            else
                return item;	
        }).
        filter( item => {
            // Filter by client
            if(filters.producto)
                if(filters.producto !== 0)
                    return filters.producto === item.id_producto
            return item;
        }).
        filter( item => {
            // Filter by status
            if(filters.proveedor)
                if(filters.proveedor !== 0)
                    return Number(filters.proveedor) === item.id_proveedor;
            return item;
        });
    }

    const abonarCompra = async (evt, purchase) => {
        evt.preventDefault();
        setErrorMsj('');

        let deuda = purchase.costo;
        if(purchase.abonos){
            deuda = deuda - purchase.abonos.total_abonado_compra;
        }
        console.log(deuda);
        if(Number(evt.target.monto_abono.value) > 0 && Number(evt.target.monto_abono.value) <= deuda){
            let data = {
                purchase_id: purchase.id,
                monto_abono: evt.target.monto_abono.value,
                fecha: evt.target.fecha.value,
                es_retiro: evt.target.es_retiro.checked,
            };
    
            console.log(data);

            if(data.es_retiro){
                console.log(estadoCaja);
                if(estadoCaja.caja){
                    let total = estadoCaja.ingresos - estadoCaja.retiros + estadoCaja.caja.fondo;
                    if(Number(data.costo) > total){
                        setErrorMsj('Error. El costo ingresado es mayor al total de la caja.')
                        return null;
                    }
        
                    else if(Number(data.costo) === 0){
                        setErrorMsj('Error. El costo ingresado es igual a cero, favor de ingresar una cantidad mayor.')
                        return null;
                    }
                }
            }

    
            try {
                let res = await SP_API('http://localhost:3002/nuevo-abono-compra', 'POST', data); 
                        
                if(res.err === false){
                    // initialFunction();
                    window.location.reload();
                }
    
                else{
                    alert('Error al abonar compra');
                }   
            } catch (error) {
                console.log(error);
            }
        }

        else{
            setErrorMsj('Error. Favor de ingresar una cantidad correcta.');
        }
    }

    // const pagarAbonoCompra = async (evt, nota) => {
    //     evt.preventDefault();
    //     let pago_abono = evt.target.pago_abono.value;
    //     let id_abono = evt.target.id_abono.value;
    //     console.log(pago_abono);

    //     setErrorMsj('');

    //     if(Number(evt.target.pago_abono.value) > 0){
    //         let data = {
    //             id_abono,
    //             abonado: pago_abono,
    //             restante: evt.target.restante.value,
    //             id_pedido: nota.id
    //         };
    
    //         console.log(data);
    //         try {
    //             let res = await SP_API('http://localhost:3002/pagar-abono-nota', 'POST', data); 
                        
    //             if(res.error === false){
    //                 // initialFunction();
    //                 window.location.reload();
    //             }
    
    //             else{
    //                 alert('Error al pagar PCE chalan');
    //             }   
    //         } catch (error) {
    //             console.log(error);
    //         }
    //     }

    //     else{
    //         setErrorMsj('Error. Favor de ingresar una cantidad correcta.');
    //     }
    // }

    const obtenerAbonos = async purchase_id => {
        try {
            let res = await SP_API('http://localhost:3002/abonos-compra/'+purchase_id, 'GET'); 
            // console.log(res);
                    
            if(res.error === false){
                // initialFunction();
                // console.log(res);
                return res;
            }

            else{
                alert('Error al pagar PCE chalan');
                return null;
            }   
        } catch (error) {
            console.log(error);
            return null;
        }
    };

    const abonosDetalleModal = item_data => {
        return <div className="product-card-modal">

        <h2>Detalle abonos</h2>

            { item_data ? 

                <div style={ { overflowX: 'auto', marginTop: 20}}>

                    <StyledTable>
                        <thead>
                            <tr>
                                <td>Monto</td>
                                <td>Fecha</td>
                                <td>Recibe</td>
                            </tr>
                        </thead>

                        <tbody>
                            { tableData ? 
                            item_data.abonos.detalle_abonos_compras.map( (item, index) => {
                                    return <tr key={index}>
                                        <td>${ item.monto_abono }</td>
                                        <td>{ item.fecha }</td>
                                    </tr>
                                })
                            : null}
                        </tbody>
                    </StyledTable>
                </div>
            : null}
        <Button type='close' style={ {marginTop: 20} } onClick={ handleModalClose }>Cerrar</Button>
    </div>
    };

    function showAbonosModal(compra){
        setModalState({ ...modalState, visible: true, content: abonosDetalleModal(compra)})
    }

    useEffect( () => {
        initialFunction();
    }, []);


    return(
        <Layout active='Compras'>
            <Container>
                { products && suppliers ?
                <>
                <h2>NUEVA COMPRA</h2>
                <form onSubmit={ createShopping }>
                    <div style={ {display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap'} }>
                        <StyledInput type='date' placeholder='Fecha' label='Fecha' name='date' required maxWidth='300px' defaultValue={ currentDate ? currentDate.date : null }/>
                
                        <label>
                            <p>Proveedor</p>
                            <select name="supplier_id">
                                <option value="0">Proveedor</option>
                                { suppliers ? suppliers.filter( s => s.id !== 1).map(supplier => <option value={ supplier.id }> {supplier.nombre} </option>) : null}
                            </select>
                        </label>

                        <label>
                            <p>Producto</p>
                            <select name="product_id">
                                <option value="0">Seleccionar producto</option>
                                { products ? products.map(product => <option value={ product.id }> {product.name} </option>) : null}
                            </select>
                        </label>

                        <StyledInput type='text' placeholder='Cantidad' label='Cantidad' name='kg' required maxWidth='300px'/>

                        <StyledInput type='text' placeholder='Costo' label='Costo' name='costo' required maxWidth='300px'/>
                            
                            {/* <label style={ {display: estadoCaja ? (estadoCaja.caja.estado === 'abierta' ? 'block' : 'none') : 'none' } }>
                                <p>Agregar como retiro</p>
                                <input type={'checkbox'} name="es_retiro" style={ {width: 30, height: 30, border: 'solid 2px #000'} } />
                            </label> */}

                    </div>
                    <p className="error-msj">{ errorMsj }</p>

                    <ButtonGroup>
                        <ControlButton type='submit' className="bg-primary">GUARDAR</ControlButton>
                        <ControlButton type='reset' className="bg-red" >CANCELAR</ControlButton>
                    </ButtonGroup>
                </form>

                <div style={ {display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '40px'} }>
                    <h2>LISTA DE COMPRAS</h2>
                    <Button className='bg-red' onClick={ () => window.location.reload() }>REINICIAR FILTROS</Button>
                </div>
                


                <div style={ { overflowX: 'auto', marginTop: 20}}>
                    {/* <TableWraper openDeleteModal={openDeleteModal} />*/}
                    
                    <StyledTable>
                        <thead>
                            <tr>
                                <td><input style={ {fontSize: 18} } type={'date'} name='date' onChange={ (evt) => setFilters({fecha: evt.target.value, proveedor: filters.proveedor, producto: filters.producto})}/></td>
                                <td>
                                    <select style={ {fontSize: 20} } name='supplier' onChange={ (evt) => setFilters({fecha: filters.fecha, proveedor: Number(evt.target.value), producto: filters.producto })}>
                                        <option value="0">Proveedor</option>
                                        { suppliers ? suppliers.filter( s => s.id !== 4).map(supplier => <option value={ supplier.id }> {supplier.nombre} </option>) : null }
                                    </select>
                                </td>
                                <td><select style={ {fontSize: 20} } name='product' onChange={ (evt) => setFilters({fecha: filters.fecha, proveedor: filters.proveedor, producto: Number(evt.target.value)})}>
                                    <option value="0">Producto</option>
                                    { products ? products.map(producto => <option value={ producto.id }> {producto.name} </option>) : null }
                                </select></td>

                                <td>Cantidad</td>
                                
                                <td>Costo</td>
                                <td>Abono</td>
                                <td>Deuda</td>
                                <td></td>
                            </tr>
                        </thead>

                        <tbody>
                            { tableData ? 
                               filterData().filter(item => item.id_proveedor !== 1).map( (item, index) => {
                                    return <tr key={index}>
                                        <td>{ item.fecha }</td>
                                        <td>{ suppliers ? suppliers.filter( supplier => item.id_proveedor === supplier.id).map( supplier => supplier.nombre) : item.id_proveedor}</td>
                                        <td>{ products ? products.filter( product => item.id_producto === product.id).map( product => product.name) : item.id_producto}</td>
                                        <td>{ item.kg }</td>
                                        
                                        
                                        <td>${ item.costo }</td>
                                        <td>${ item.abonos ? item.abonos.total_abonado_compra : null} </td>
                                        <td>${ item.abonos ? item.costo - item.abonos.total_abonado_compra : item.costo}</td>
                                        <td style={ {display: 'flex'} }>
                                            <Button className="bg-red" onClick={ () => openDeleteModal(item) }><FontAwesomeIcon icon={faTimes} /> Eliminar</Button>
                                            { item.abonos? ( item.abonos.total_abonado_compra !== item.costo ? <Button ml className="bg-blue" onClick={ () => {setCurrentOrder(item); setAbonoModalState({...abonoModalState, visible: true})} }><FontAwesomeIcon icon={faPlus} /> Dar abono</Button> : null) : null }
                                            { item.abonos ? ( item.abonos.detalle_abonos_compras.length > 0 ? <Button ml className="bg-light-blue" onClick={ () => { showAbonosModal(item);} }>ver abonos</Button> :null ): null}
                                        </td>
                                    </tr>
                                })
                            : null}
                        </tbody>
                    </StyledTable>
                    
                </div>
                </>
                : null }
            </Container>

            <Modal title='Mi titulo' visible={ modalState.visible }  handleModalClose={  handleModalClose } >
                { modalState.content }
            </Modal>

            {/* Abono modal */}
            <Modal title='Abono modal' visible={ abonoModalState.visible }  handleModalClose={ () => { handleAbonoModalClose(); setCurrentNumber(''); setErrorMsj('');} } >
                <ModalForm onSubmit={ event => abonarCompra(event, currentOrder) }>
                    <FechaInput type={'date'} name='fecha' defaultValue={ currentDate ? currentDate.date : null }/>
                    <Total>Deuda de compra restante: <strong>$ { currentOrder ? (currentOrder.abonos ? currentOrder.costo - currentOrder.abonos.total_abonado_compra: currentOrder.costo ): '0'} </strong></Total>
                    <Total>Total de abono a pagar: <strong>$ { currentNumber ? currentNumber : '0'} </strong></Total>

                    <label style={ {display: estadoCaja ? (estadoCaja.caja.estado === 'abierta' ? 'flex' : 'none') : 'none', justifyContent: 'center',  alignContent: 'center', alignItems: 'center'} }>
                            <p>Agregar como retiro</p>
                            <input type={'checkbox'} name="es_retiro" style={ {width: 30, height: 30, marginTop: 40, border: 'solid 2px #000'} } />
                    </label>
                    
                    {/* <Change>Cambio: <strong> $ { currentOrder ? ((Number(currentNumber) - currentOrder.total_pagar ) > 0 ? (Number(currentNumber) - currentOrder.total_pagar ) : 0).toFixed(2) : 0} </strong></Change> */}
                    <PaymentAmount>${ currentNumber ? currentNumber : '0'}</PaymentAmount>
                    <p style={ {fontSize: 26, color: 'red', textAlign: 'center'} }>{ errorMsj } </p>
                    <input type='hidden' name='monto_abono' value={currentNumber ? currentNumber : '0'} />
                    
                    {/* <input type='hidden' name='deuda_restante' value={ currentOrder ? ((currentOrder.abonos.total_abonado ? currentOrder.adeudo - currentOrder.abonos.total_abonado: currentOrder.adeudo)) : null} /> */}


                    <Keypad currentNumber={currentNumber} setCurrentNumber={setCurrentNumber} />

                    <ModalButtons>
                        <Button type="submit" className="bg-primary">Pagar</Button>
                        <Button type="button" className="bg-red" onClick={ () => { handleAbonoModalClose(); setCurrentNumber(''); setErrorMsj('');} }>Cancelar</Button>
                    </ModalButtons>
                </ModalForm>
            </Modal>
            <style>
                {
                    `
                        label p{
                            font-weight: 600;
                            font-size: 24px;
                        }

                        input,select{
                            font-size: 24px;
                        }

                        select{
                            padding: 5px;
                        }

                        .error-msj{
                            font-size: 22px;
                            color: red;
                            font-weight: 700;
                        }
                    `
                }
            </style>

        </Layout>
    );
}