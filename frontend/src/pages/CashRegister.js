import Layout from "../components/Layout.";
import styled from "styled-components";

import Input from "../components/Input/Input";
import Button from "../components/Button";
import Keypad from "../components/Keypad";

import { useState, useEffect} from 'react';
import { getItems, updateItem, deleteItem, insertItem, SP_API } from "../utils/SP_APPI";
import Modal from "../components/Modal/Modal";
import useModal from "../hooks/useModal";

import { roundNumber } from "../utils/Operations";
import { isContentEditable } from "@testing-library/user-event/dist/utils";

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

const ButtonGroupTop = styled.div`
    display: flex;
    justify-content: flex-end;

    & button{
        margin-left: 20px;
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
    font-size: 22px;
    overflow: hidden;

    display: block;
    margin: auto;

    max-height: 320px;
    overflow-y: scroll;

    tbody tr:nth-child(even) {
        background-color: #eee;
    }

    td{
        padding: 10px;
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
export default function Suppliers(){
    const [tableData, setTableData] = useState(null);
    const [cashRegisterStatus, setCashRegisterStatus] = useState(null);
    const { modalState, setModalState, handleModalClose } = useModal();
    const { modalState: withdrawModalState, setModalState: setWithdrawModalState, handleModalClose: handleWithdrawModalClose } = useModal();
    const { modalState: cajaModalState, setModalState: setCajaModalState, handleModalClose: handleCajaModalClose } = useModal();
    const { modalState: productosModalState, setModalState: setProductosModalState, handleModalClose: handleProductosModalClose } = useModal();

    const [ currentNumber, setCurrentNumber ] = useState('');
    const [ cashRegisterRecords, setCashRegisterRecords ]  = useState(null);
    const [ filters, setFilters ] = useState({fecha: null, fecha_retiro: null});
    const [ withdrawals, setWithdrawals ] = useState(null);
    const [ errorMsj, setErrorMsj] = useState('');
    const [ detalleCaja, setDetalleCaja ] = useState(null);
    const [ currentDetalleCaja, setCurrentDetalleCaja ] = useState(null);
    const [ sumatoria, setSumatoria ] = useState(null);


    const fields = ['Nombre', 'Eliminar', 'Modificar'];

    const initialFunction = async () => {
        let res = await getItems('proveedores');
        let res_cash_register = await getItems('estado-caja');
        let res_cash_register_records = await getItems('cierres-caja');
        let res_withdrawals = await getItems('retiros');
        console.log(res_cash_register_records.cierres_caja);
        setCashRegisterRecords(res_cash_register_records.cierres_caja);
        setWithdrawals(res_withdrawals);

        if(res.err !== true){
            setTableData(res);
            console.log(res);
        }
        
        if(res_cash_register.err !== true){
            if(res_cash_register.caja){
                console.log(res_cash_register);
                setCashRegisterStatus(
                    {...res_cash_register,
                        retiros: res_cash_register.retiros ? res_cash_register.retiros : 0,
                        ingresos: res_cash_register.ingresos ? res_cash_register.ingresos : 0
                    });
            }
        }
        
    };

    const createSupplier = async evt =>{
        evt.preventDefault();
        let data = {
            nombre: evt.target.nombre.value,
        };

        let res = await insertItem('proveedor', data);
        if(res.err === false){
            evt.target.reset(); 
            initialFunction();   
        }

        else{
            alert('Error al actualizar proveedor');
        }
    };
    
    const openEditModal = data => {
        setModalState({visible: true, content: editModal(data)});
    };

    const updateSupplier= async evt => {
        evt.preventDefault();
        let data = {
            nombre: evt.target.nombre.value,
            supplier_id: evt.target.supplier_id.value
        };
        
        handleModalClose();

        let res = await updateItem('proveedor', data);
        if(res.err === false){
            initialFunction();    
        }

        else{
            alert('Error al actualizar proveedor');
        }
    };

    const openCashRegister = async evt => {
        evt.preventDefault();
        let fondo = evt.target.fondo.value;
        if(fondo){
            let data = { fondo, cajero: localStorage.getItem('username')};
            let res = await SP_API('http://localhost:3002/abrir-caja', 'POST', data);
            console.log(res);
        }
        window.location.reload();
    }
    
    const closeCashRegister = async evt => {
        evt.preventDefault();
        let data = {
            ingresos: cashRegisterStatus.ingresos,
            retiros: cashRegisterStatus.retiros,
            total: cashRegisterStatus.ingresos - cashRegisterStatus.retiros + cashRegisterStatus.caja.fondo,
            cajero: localStorage.getItem('username')
        };

        let res = await SP_API('http://localhost:3002/cerrar-caja', 'POST', data);
        console.log(res);
        if(res.error === false){
            window.location.reload();
        }

        else{
            alert('Error al cerrar la caja');
        }
        
    }

    const closeSingleCashRegister = async evt => {
        evt.preventDefault();
        let data = {
            date: evt.target.date.value,
            ingresos: evt.target.ingresos.value,
            retiros: evt.target.retiros.value,
            total: evt.target.total.value,
            cajero: localStorage.getItem('username')
        };

        console.log(data);
        
        let res = await SP_API('http://localhost:3002/cerrar-caja-previa', 'POST', data);
        console.log(res);
        window.location.reload();
    }

    const withdrawMoney = async evt => {
        evt.preventDefault();
        let monto = evt.target.monto.value;
        let concepto = evt.target.concepto.value;
        setErrorMsj('');
        // Validate total
        console.log(cashRegisterStatus);
        if(cashRegisterStatus.caja){
            let total = cashRegisterStatus.ingresos - cashRegisterStatus.retiros + cashRegisterStatus.caja.fondo
            if(Number(monto) <= total){
                if(Number(monto) > 0 && concepto){
                    // console.log("Monto: " + monto, "Total caja", cashRegisterStatus.caja.total);
                    let data = {monto, concepto}
                    let res = await SP_API('http://localhost:3002/retirar-dinero', 'POST', data);
                    console.log(res);
                    window.location.reload();
                }
        
                else{
                    setErrorMsj('Error. Favor de completar todos los campos.');
                }
            }

            else{
                setErrorMsj('Error. El monto ingresado es mayor al total de la caja.')
            }
        }

        else{
            setErrorMsj('Error al leer el estado de la caja');
        }


    }

    const editModal = item_data => {
        return <div className="product-card-modal">

        <p>Editar datos de <strong style={ {fontSize: 16}}>{ item_data.nombre }</strong></p>

        <form className="modal-form" onSubmit={ updateSupplier }>
            <input type='hidden' name='supplier_id' required defaultValue={item_data.id} /> 
            <Input placeholder='Nombre' label='Nombre' name='nombre' required defaultValue={item_data.nombre} /> 
            <div className="modal-buttons">
                <Button className="bg-primary" type='submit'>Guardar</Button>
                <Button className="bg-red" onClick={ handleModalClose }>Cancelar</Button>
            </div>
        </form>
    </div>
    };

    const closeSingleCashRegisterModal = (_date, total, retiros, ingresos) => {
        return <div className="product-card-modal">

        <p>Confirma hacer el cierre de caja del dia <strong style={ {fontSize: 16}}>{ _date }</strong></p>
            <form className="modal-form" onSubmit={ closeSingleCashRegister }>
                <input type='hidden' value={_date} name='date' />
                <input type='hidden' value={total} name='total' />
                <input type='hidden' value={retiros} name='retiros' />
                <input type='hidden' value={ingresos} name='ingresos' />
                <div className="modal-buttons">
                    <Button className="bg-red" type='submit'>SI, CERRAR CAJA</Button>
                    <Button className="bg-white" onClick={ handleModalClose }>CANCELAR</Button>
                </div>
            </form>
        </div>
    };

    const obtenerDetalleCaja = async date => {
        let res_retiros = await getItems('retiros/'+date);
        if(res_retiros.error === false){
            setDetalleCaja({retiros: res_retiros.retiros});
        }
    }

    const obtenerSumatoriaProductos = async date => {
        console.log('Obteniendo detalle sumatoria');
        let res_sumatoria = await getItems('sumatoria-productos/'+date);
        if(res_sumatoria.error === false){
            console.log(res_sumatoria);
            setSumatoria(res_sumatoria);
        }
    }

    const modalSumatoriaProductos = item => {
        return                 <div className="product-card-modal">
        <p style={ {fontSize: 18} }>Detalle de retiros de caja del dia <strong style={ {fontSize: 16}}>{ item.fecha }</strong></p>
        { sumatoria ? 
        <div style={ { display: 'flex', flexDirection: 'column', alignItems: 'flex-start'} }>

            <h3 style={ {marginTop: 5, fontSize: 24, marginBottom: 5} }>RETIROS</h3>
            <div style={ { overflowX: 'auto', display: 'flex', marginBottom: 20}}>
                <StyledTable>
                    <thead>
                        <tr>
                            <td>Producto</td>
                            <td>Cantidad Kg</td>
                            <td>Total</td>
                        </tr>
                    </thead>

                    <tbody>
                    { sumatoria ? 
                            sumatoria.map( (item, index) => {
                            return <tr key={index}>
                                <td>{ item.nombre }</td>
                                <td>${ item.sumatoria }</td>
                                <td>{ item.precio }</td>
                            </tr>
                        })
                    : null }
                    </tbody>
                </StyledTable>
            </div>
        </div>
        : null }
        </div>
    }

    const confirmationModal = (_date) => {
        return <div className="product-card-modal">

        <p>Confirma hacer el cierre de caja del dia <strong style={ {fontSize: 16}}>{ _date }</strong></p>
            <form className="modal-form" onSubmit={ closeCashRegister }>
                <div className="modal-buttons">
                    <Button className="bg-red" type='submit'>SI, CERRAR CAJA</Button>
                    <Button className="bg-white" onClick={ handleModalClose }>CANCELAR</Button>
                </div>
            </form>
        </div>
    };

    const detailModal = (item) => {
        return 
    };

    const openDetailModal = item =>{
        // setModalState({visible: true, content: detailModal(item)});
        setCajaModalState({visible: true});
        obtenerDetalleCaja(item.fecha);
        setCurrentDetalleCaja(item);
        console.log(item);
    }

    const openProductDetailModal = item => {
        console.log('abrir detalle venta');
        obtenerSumatoriaProductos(item.fecha);
        setProductosModalState({visible: true});
        setCurrentDetalleCaja(item);
    }

    const openConfirmationModal = data => {
        let date_ob = new Date();
        // current date
        // adjust 0 before single digit date
        let date = ("0" + date_ob.getDate()).slice(-2);
    
        // current month
        let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    
        // current year
        let year = date_ob.getFullYear();

        let datetime = year + "-" + month + "-" + date;
        setModalState({visible: true, content: confirmationModal(datetime)});
    };

    const openSingleCashRegisterModal = (date, total, retiros, ingresos) =>{
        setModalState({visible: true, content: closeSingleCashRegisterModal(date, total, retiros, ingresos)});
    }


    useEffect( () => {
        initialFunction();
    }, []);

    return(
        <Layout active='Caja'>
            <Container>
                <h2 style={ {display: 'flex', justifyContent: 'space-between'} }>
                    ADMINISTRACIÓN DE CAJA
                    { cashRegisterStatus ? cashRegisterStatus.caja.estado === 'abierta' ? 
                <> 
                        <ButtonGroupTop>
                            { cashRegisterStatus ? cashRegisterStatus.caja.estado === 'abierta' ? 
                                <Button className='bg-primary' onClick={ () => setWithdrawModalState({...withdrawModalState, visible: true}) }>REALIZAR RETIRO</Button>
                            : null : null }
                        </ButtonGroupTop>
                </>
                : null : null }
                </h2>
                


                { cashRegisterStatus ? cashRegisterStatus.caja.estado === 'abierta' || cashRegisterStatus.caja.estado === 'cerrada' ? 
                <>
                    <h2 style={ {marginBottom: 0} }>ESTADO CAJA</h2>
                    <div style={ {display: 'flex', justifyContent: 'space-around', fontSize: '30px'} }>
                        <div>
                            <h3>Retiros: </h3><p>${ cashRegisterStatus ? cashRegisterStatus.retiros.toFixed(2) : null} </p>
                        </div>
                        <div>
                            <h3>Ingresos: </h3><p>${ cashRegisterStatus ? cashRegisterStatus.ingresos.toFixed(2) : null}</p>
                        </div>

                        <div>
                            <h3>Fondo: </h3><p>${ cashRegisterStatus ? cashRegisterStatus.caja.fondo.toFixed(2) : null}</p>
                        </div>

                        <div>
                            <h3>Total: </h3><p>${ cashRegisterStatus ? (cashRegisterStatus.ingresos - cashRegisterStatus.retiros + cashRegisterStatus.caja.fondo).toFixed(2) : null}</p>
                        </div>
                    </div>

                    <h2>LISTA DE CIERRES DE CAJA</h2>

                    <div style={ { overflowX: 'auto', display: 'flex'}}>
                        <StyledTable style={ {maxHeight: 560} }>
                            <thead>
                                <tr>
                                    <td><input style={ {fontSize: 18} } type={'date'} name='date' onChange={ (evt) => setFilters({fecha: evt.target.value})}/></td>
                                    <td>Fondo</td>
                                    <td>Ingresos</td>
                                    <td>Retiros</td>
                                    <td>Total</td>
                                    {/* <td>Cajero</td> */}
                                    <td>Acciones</td>
                                </tr>
                            </thead>

                            <tbody>
                            { cashRegisterRecords ? 
                                    cashRegisterRecords.filter( item => {
                                            // Filter by date
                                            if(filters.fecha)
                                                return item.fecha === filters.fecha;
                                            else
                                                return item;	
                                    }).map( (item, index) => {
                                    return <tr key={index}>
                                        <td>{ item.fecha }</td>
                                        <td>${ item.fondo }</td>
                                        <td>${ item.estado === 'abierta' ? roundNumber(item.SumaIngresos): item.ingresos}</td>
                                        <td>${ item.estado === 'abierta' ? roundNumber(item.SumaRetiros) : item.retiros}</td>
                                        <td>${ item.estado === 'abierta' ? roundNumber( (item.fondo + item.SumaIngresos) - item.SumaRetiros): item.total }</td>
                                        {/* <td>{ item.cajero }</td> */}
                                        <td style={ {display: 'flex'} }><Button className="bg-blue" onClick={ () => openDetailModal(item) }>Detalle Retiros</Button> <Button className="bg-light-blue" onClick={ () => openProductDetailModal(item) } ml>Detalle venta</Button> { item.estado === 'abierta' && localStorage.getItem('sp_rol') === '1' ? <Button className="bg-red" ml onClick={ () => openSingleCashRegisterModal(item.fecha, roundNumber( (item.fondo + item.SumaIngresos) - item.SumaRetiros), roundNumber(item.SumaRetiros), roundNumber(item.SumaIngresos))}>Cerrar caja</Button> : null}</td>
                                    </tr>
                                })
                            : null}
                            </tbody>
                        </StyledTable>
                    </div>

                    {/* <h2>LISTA DE RETIROS</h2>

                    <div style={ { overflowX: 'auto', display: 'flex'}}>
                        <StyledTable>
                            <thead>
                                <tr>
                                    <td>Fecha</td>
                                    <td>Monto</td>
                                    <td>Concepto</td>
                                </tr>
                            </thead>

                            <tbody>
                            { withdrawals ? 
                                    withdrawals.retiros.map( (item, index) => {
                                    return <tr key={index}>
                                        <td>{ item.fecha_retiro }</td>
                                        <td>${ item.monto }</td>
                                        <td>{ item.concepto }</td>
                                    </tr>
                                })
                            : null}
                            </tbody>
                        </StyledTable>
                    </div> */}

                    
                </>
                : null : null }

                { cashRegisterStatus ? null : 
                <>
                    <h2>APERTURA DE CAJA</h2>

                    <form onSubmit={ openCashRegister }>
                        <input type='hidden' value={currentNumber ? currentNumber : '0'} name='fondo' required/>
                        <PaymentAmount>Fondo: ${ currentNumber ? currentNumber : '0'}</PaymentAmount>
                        <Keypad currentNumber={currentNumber} setCurrentNumber={setCurrentNumber} />
                        <ButtonGroup>
                            <ControlButton type='submit' className="bg-primary">ABRIR CAJA</ControlButton>
                            <ControlButton type='reset' className="bg-red" onClick={ () => setCurrentNumber('') }>CANCELAR</ControlButton>
                        </ButtonGroup>
                    </form>
                </>
                }

            <Modal title='Mi titulo' visible={ modalState.visible }  handleModalClose={ () => { handleModalClose();  } } >
                { modalState.content }
            </Modal>


            <Modal title='Mi titulo' visible={ productosModalState.visible }  handleModalClose={ () => { handleProductosModalClose(); setSumatoria(null); setCurrentDetalleCaja(null);  } } >
                <div className="product-card-modal">
                { currentDetalleCaja ? 
                <>
                <p style={ {fontSize: 18} }>Detalle de ventas del dia <strong style={ {fontSize: 16}}>{ currentDetalleCaja.fecha }</strong></p>
                    { sumatoria ? 
                    <div style={ { display: 'flex', flexDirection: 'column', alignItems: 'flex-start'} }>

                        <h3 style={ {marginTop: 5, fontSize: 24, marginBottom: 5} }>VENTAS</h3>
                        <div style={ { overflowX: 'auto', display: 'flex', marginBottom: 20}}>
                            <StyledTable>
                                <thead>
                                    <tr>
                                        <td>Producto</td>
                                        <td>Cantidad</td>
                                        <td>Total</td>
                                    </tr>
                                </thead>

                                <tbody>
                                { sumatoria ? 
                                        sumatoria.sumatorias.filter( s => s.Sumatoria > 0).map( (item, index) => {
                                        return <tr key={index}>
                                            <td>{ item.nombre }</td>
                                            <td>{ roundNumber(item.Sumatoria) } { item.venta_por }</td>
                                            <td>${ roundNumber(item.precio  * item.Sumatoria) }</td>
                                        </tr>
                                    })
                                : null }
                                </tbody>
                            </StyledTable>
                        </div>
                    </div>
                    : null }

                    </>
                    : null }

                    <Button className="bg-red" style={ { display: 'block', margin: 'auto'} } type='button' onClick={ () => { handleProductosModalClose();  setSumatoria(null); setCurrentDetalleCaja(null); } }>CERRA VENTANA</Button>
                </div>
            </Modal>

            <Modal title='Detalle caja' visible={ cajaModalState.visible }  handleModalClose={ () => { handleCajaModalClose();  } } >
                <div className="product-card-modal">
                <p style={ {fontSize: 18} }>Detalle de retiros de caja del dia <strong style={ {fontSize: 16}}>{ currentDetalleCaja ? currentDetalleCaja.fecha : null}</strong></p>
                { detalleCaja ? 
                <div style={ { display: 'flex', flexDirection: 'column', alignItems: 'flex-start'} }>

                    <h3 style={ {marginTop: 5, fontSize: 24, marginBottom: 5} }>RETIROS</h3>
                    <div style={ { overflowX: 'auto', display: 'flex', marginBottom: 20}}>
                        <StyledTable>
                            <thead>
                                <tr>
                                    <td>Fecha</td>
                                    <td>Monto</td>
                                    <td>Concepto</td>
                                </tr>
                            </thead>

                            <tbody>
                            { detalleCaja.retiros ? 
                                    detalleCaja.retiros.map( (item, index) => {
                                    return <tr key={index}>
                                        <td>{ item.fecha_retiro }</td>
                                        <td>${ roundNumber(item.monto) }</td>
                                        <td>{ item.concepto }</td>
                                    </tr>
                                })
                            : null }
                            </tbody>
                        </StyledTable>
                    </div>
                </div>
                : null }
                <form className="modal-form" onSubmit={ closeCashRegister }>
                    <div className="modal-buttons">
                        <Button className="bg-red" style={ { display: 'block', margin: 'auto'} } type='button' onClick={ () => { setCajaModalState({visible: false}); setDetalleCaja(null); } }>CERRA VENTANA</Button>
                    </div>
                </form>
            </div>
            </Modal>

            <Modal visible={ withdrawModalState.visible }  handleModalClose={ () => { handleWithdrawModalClose(); setErrorMsj(''); } } >
                <form onSubmit={ withdrawMoney }>
                        <input type='hidden' value={currentNumber ? currentNumber : '0'} name='monto' required/>
                        <PaymentAmount>Concepto: <input type='text' style={ {fontSize: 26, maxWidth: 300, border: 'solid 2px #000'} } name='concepto' required/></PaymentAmount>
                        <PaymentAmount>Retiro: ${ currentNumber ? currentNumber : '0'}</PaymentAmount>
                        { errorMsj ? <p style={ {fontSize: 26, color: 'red', textAlign: 'center'} }>{ errorMsj }</p> : null}
                        <Keypad currentNumber={currentNumber} setCurrentNumber={setCurrentNumber} />
                        <ButtonGroup>
                            <ControlButton type='submit' className="bg-primary">RETIRAR</ControlButton>
                            <ControlButton type='reset' className="bg-red" onClick={ () => { setWithdrawModalState({...withdrawModalState, visible: false}); setCurrentNumber(''); setErrorMsj(''); } }>CANCELAR</ControlButton>
                        </ButtonGroup>
                </form>
            </Modal>
            </Container>

        </Layout>
    );
}