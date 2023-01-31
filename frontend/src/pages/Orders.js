import Layout from "../components/Layout.";
import styled from "styled-components";

import Button from "../components/Button";

import { useState, useEffect} from 'react';
import { getItems, SP_API } from "../utils/SP_APPI";
import Modal from "../components/Modal/Modal";
import useModal from "../hooks/useModal";
import Keypad from "../components/Keypad";

import { roundNumber } from "../utils/Operations";

const Container = styled.div`
    padding: 20px;
`;

const StyledTable = styled.table`
    border-collapse: collapse;
    border: 1px solid black;
    width: 100%;
    font-size: 20px;

    tbody tr:nth-child(even) {
        background-color: #eee;
    }

    td{
        padding: 2px;
    }
      
    thead tr th {
        background-color: #26C485;
        color: #000;
        text-align: left;
        padding: 2px;
    }
`;

const OrderDetailContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    margin-bottom: 20px;
`;

const OrderDetail = styled.div`
`;

const Detail = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-around;

    & > p:nth-child(2){
        margin-left: 10px;
    }
`;

const ContraEntrega = styled.div`
    display: block;
    margin: auto;

    h2{
        text-align: center;
        font-weight: normal;
        margin-bottom: 10px;
        font-size: 26px;
    }

    select{
        display: block;
        font-size: 24px;
        margin: auto;
        margin-bottom: 20px
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

const Change = styled.p`
    font-size: 36px;
    text-align: center;
    margin-top: 5px;
`;

const PaymentAmount = styled.p` 
    font-size: 36px;
    font-weight: 600;
    text-align: center;
`;

const ActionButton = styled.button`
    display: block;
    border: solid 1px #000;
    font-weight: 700;
    font-size: 18px;
    text-transform: uppercase;
    padding: 18px 8px;
    border-radius: 5px;

    ${props => props.ml ? 'margin-left: 5px;' : ''}

    &:hover{
        cursor: pointer;
        background-color: white;
        border-color: #000;
    }
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

const getOrderStatusLabel = status_id => {
    let chalan = status_id.chalan;
    status_id = status_id.estado;

    switch(status_id){
        case 1:
            return <span className="badge badge-primary">Pagado</span> 
        

        case 2:
            return <span className="badge badge-red">Fiado</span> 
        

        case 3:
            return <span className="badge badge-blue">Enviado ({chalan})</span> 
        

        case 4:
            return <span className="badge badge-blue">PCE</span>
        
        default:
            return null;
    };
};

export default function Pedidos(){
    const [tableData, setTableData] = useState(null);
    const [orders, setOrders] = useState(null);
    const [chalanes, setChalanes] = useState(null);
    const [clients, setClients] = useState(null);
    const [filters, setFilters] = useState({fecha: null, cliente: null, chalan: '', estado: null});
    const { modalState, setModalState, handleModalClose } = useModal();
    const { modalState: paymentModalState, setModalState: setPaymentModalState, handleModalClose: handlePaymentModalClose } = useModal();
    const { modalState: APCModalState, setModalState: setAPCModalState, handleModalClose: handleAPCModalClose } = useModal();

    const [ currentNumber, setCurrentNumber ] = useState('');
    const [ currentOrder, setCurrentOrder] = useState(null);
    const [ errorMsj, setErrorMsj ] = useState('');
    const [ estadoCaja, setEstadoCaja ] = useState(null);
    const [ currentDate, setCurrentDate ] = useState('');
    const [ clientDebt, setClientDebt ] = useState();

    const initialFunction = async () => {
        let res = await getItems('pedidos');
        let res_chalanes = await getItems('chalanes');
        let res_clientes = await getItems('clientes');
        let res_caja = await getItems('estado-caja');
        let res_date = await SP_API('http://localhost:3002/date', 'GET');
        
        // console.log(res_caja);

        setEstadoCaja(res_caja);
        setChalanes(res_chalanes);
        setClients(res_clientes);
        setCurrentDate(res_date);
        obtenerAdeudos(res);
    };

    const obtenerAdeudos = async notas =>{
        for(let nota of notas){
            if(nota.estado === 2){
                let abonos = await obtenerAbonos(nota.id);
                nota.abonos = abonos;
                // console.log(abonos);
            }
        };
        console.log(notas);
        setTableData(notas);
        setOrders(notas) 
    }
    
    const openEditModal = product_data => {
        setModalState({visible: true, content: editModal(product_data)});
    };

    const openFiarModal = product_data => {
        setModalState({visible: true, content: fiarModal(product_data)});
    };

    const openDetailModal = order_data => {
        setModalState({visible: true, content: detailModal(order_data)});
    };

    const payOrder = async order => {
        console.log(order);

        let data = {
            total: order.total_pagar,
            order_id: order.id,
            cajero: localStorage.getItem('username'),
        };

        console.log(data);
        handleModalClose();

        try {
            let res = await SP_API('http://localhost:3002/pagar-pedido', 'POST', data); 
            console.log(res);

            let nuevo_pedido_detalle = await SP_API('http://localhost:3002/pedido-detalle/' + order.id, 'GET', );
            if(nuevo_pedido_detalle.length === 1){
                console.log(nuevo_pedido_detalle);

                await printTicket(nuevo_pedido_detalle[0]);
            }

                    
            if(res.error === false){
                initialFunction();
            }

            else{
                alert('Error al actualizar el producto');
            }   
        } catch (error) {
            console.log(error);
        }
    };

    const payOrderPCE = async evt => {
        evt.preventDefault();
        setCurrentNumber('');
        setErrorMsj('');
        if(evt.target.contra_entrega.value !== '0'){
            console.log('Contra entrega');
            let order = {
                order_id: evt.target.order_id.value,
                chalan: evt.target.contra_entrega.value,
                cajero: localStorage.getItem('username')
            }
    
            let res = await SP_API('http://localhost:3002/pce-pedido', 'POST', order); 

            let nuevo_pedido_detalle = await SP_API('http://localhost:3002/pedido-detalle/' + order.order_id, 'GET', );
            if(nuevo_pedido_detalle.length === 1){
                console.log(nuevo_pedido_detalle);
                await printTicket(nuevo_pedido_detalle[0]);
            }
    
            console.log(res);
            if(res.error === false){
                window.location.reload();
            }
        }

        else{
            console.log('Fiado');
            if(currentNumber){
                if(Number(currentNumber) >= Number(evt.target.total_pagar.value)){
                    payOrder({total_pagar: evt.target.total_pagar.value, id: evt.target.order_id.value});
                    handlePaymentModalClose();
                    return null;
                }
                setErrorMsj('Error. La cantidad ingresada para el pago no es valida. Favor de verificar.')
                return null;
            }
            setErrorMsj('Error. Favor de ingresar una cantidad correcta.');
        }
    };

    const fiarOrder = async (evt, order_detail) => {
        console.log(order_detail);
        evt.preventDefault();
        
        let order = {
            order_id: order_detail.id,
            cajero: localStorage.getItem('username'),
            adeudo: order_detail.total_pagar
        }

        let res = await SP_API('http://localhost:3002/fiar-pedido', 'POST', order); 

        let nuevo_pedido_detalle = await SP_API('http://localhost:3002/pedido-detalle/' + order.order_id, 'GET', );
        if(nuevo_pedido_detalle.length === 1){
            console.log(nuevo_pedido_detalle);
            await printTicket(nuevo_pedido_detalle[0]);
            debugger;
        }

        console.log(res);
        if(res.error === false){
            window.location.reload();
        }
    }

    const getOrderDetail = async order_id => {
        let res_order_detail = await getItems('pedido/'+order_id);
        return res_order_detail;
    };

    const getOrderStatusText = n => {
        switch(n){
            case 1:
                return 'Pagado';
            case 2:
                return 'Adeudo';
            case 3:
                return 'Enviado';
            case 4:
                return 'PCE';

            default:
                return '';
        }
    }

    const printTicket = async ticket_order => {
        let res_order_detail = await getOrderDetail(ticket_order.id);
        // let adeudo_res = await SP_API(`http://localhost:3002/obtener-adeudo/${ticket_order.id_cliente}/${ticket_order.id}`, 'GET');
        let id_cajero = await SP_API(`http://localhost:3002/id-usuario`, 'POST', {username: ticket_order.cajero});
        let adeudo_res = await SP_API(`http://localhost:3002/obtener-adeudo/${ticket_order.id_cliente}`, 'GET');
        ticket_order.detalle = res_order_detail;

        let final_ticket_data = {
            id_pedido: ticket_order.id,
            fecha: ticket_order.fecha,
            cajero: ticket_order.cajero,
            // cajero: localStorage.getItem('sp_user_id'),
            // cajero: id_cajero.id,
            chalan: ticket_order.chalan ? ticket_order.chalan.split(',')[1] : 'NA',
            cliente: ticket_order.nombre_cliente,
            // adeudo: ticket_order.adeudo,// ticket_order.adeudo,
            adeudo: Number(adeudo_res.adeudo) - Number(adeudo_res.abonado),
            estado_nota: getOrderStatusText(ticket_order.estado),
            efectivo: null,
            productos: ticket_order.detalle
        };

        console.log(final_ticket_data);
    
        let res = await SP_API('http://localhost:3002/imprimir-ticket', 'POST', final_ticket_data);
        console.log(res);
        alert('Ticket impreso');
    };

    const chalanesSelect = chalanes ? <select name='contra_entrega' style={ {padding: 5} }>
    <option value='0' style={ {fontSize: 24} }>Seleccionar chalan</option>
    { chalanes.map( chalan => <option  style={ {fontSize: 24} } value={chalan.id + ',' + chalan.nombre}>{ chalan.nombre}</option>) }
</select> : null;

    const editModal = order => {
        return <div className="product-card-modal">

        <p style={ {fontSize: 24} }>Confirma que recibio la cantidad de <strong style={ {fontSize: 24} }>${order.total_pagar}</strong> por parte de <strong style={ {fontSize: 24} }>{ order.chalan.split(',')[1]}</strong></p>

        <form className="modal-form" onSubmit={  (event) => { event.preventDefault(); payOrder(order) } }>
            <div className="modal-buttons">
                <Button className="bg-primary" type='submit'>Cobrar</Button>
                <Button className="bg-red" onClick={ handleModalClose }>Cancelar</Button>
            </div>
        </form>
    </div>
    };

    const fiarModal = order => {
        return <div className="product-card-modal">

        <p style={ {fontSize: 24}}>Confirma fiar al cliente <strong style={ {fontSize: 24}}>{ order.nombre_cliente}</strong> la cantidad de <strong style={ {fontSize: 24}}>${ order.total_pagar}</strong></p>

        <form className="modal-form" onSubmit={  event => fiarOrder(event, order) }>
            <div className="modal-buttons">
                <Button className="bg-red" type='submit'>Fiar</Button>
                <Button className="bg-white" onClick={ handleModalClose }>Cancelar</Button>
            </div>
        </form>
    </div>
    };
    
    const detailModal = order => {
        return <div className="product-card-modal">

        <p style={ {fontSize: 20} }>Detalle nota de <strong>{ order.nombre_cliente}</strong></p>

        <OrderDetailContainer>
            <OrderDetail>
                <Detail>
                    <p><strong>Fecha:</strong></p> <p>{ order.fecha }</p>
                </Detail>
            </OrderDetail>
            <OrderDetail>
                <Detail>
                    <p><strong>Cajero:</strong></p> <p>{ order.cajero }</p>
                </Detail>
            </OrderDetail>
            <OrderDetail>
                <Detail>
                    <p><strong>Productos:</strong></p> <p>{ order.productos }</p>
                </Detail>
            </OrderDetail>

            <OrderDetail>
                <Detail>
                    <p><strong>Total pagar:</strong></p> <p>${ order.total_pagar }</p>
                </Detail>
            </OrderDetail>
        </OrderDetailContainer>

        <Button className="bg-white" type='submit' onClick={ handleModalClose }>Cerrar</Button>
    </div>
    };

    const mostrarDeudaTotal = async cliente => {
        if(cliente !== '0'){
            let id_cliente = cliente.split(',')[0];
            console.log(cliente);
            let res = await SP_API('http://localhost:3002/deuda-usuario/'+id_cliente, 'GET');
            console.log(res)
            if(res){
                setClientDebt(roundNumber( Number(res[0].deuda_cliente) -  Number(res[1].total_abonado) ));
            }
        }
        else{
            setClientDebt(null);
        }
        
    }

    useEffect( () => {
        initialFunction();
    }, []);

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
            if(filters.cliente)
                if(filters.cliente !== '0')
                    return Number(filters.cliente.split(',')[0]) === item.id_cliente
            return item;
        }).
        filter( item => {
            // Filter by chalan
            if(filters.chalan){
                if(filters.chalan !== '0'){
                    if(item.abonos){
                        if(item.abonos.detalle_abonos){
                            return (item.abonos.detalle_abonos.filter( detalle_abono => detalle_abono.chalan === filters.chalan )).length > 0;
                        }
                        return false;
                    }
                    return false;
                }
                    // return filters.chalan === item.chalan
            }
            return item;
        }).
        filter( item => {
            // Filter by status
            if(filters.estado)
                if(filters.estado !== '0')
                    return Number(filters.estado) === item.estado;
            return item;
        });
    }

    async function pagarPCEChalan(){

        let data = {
            chalan: filters.chalan,
            cajero: localStorage.getItem('username')
        };

        console.log(data);

        try {
            let res = await SP_API('http://localhost:3002/pagar-pce-chalan', 'POST', data); 
                    
            if(res.error === false){
                initialFunction();
            }

            else{
                alert('Error al pagar PCE chalan');
            }   
        } catch (error) {
            console.log(error);
        }
    }

    const abonar = async (evt, order) => {
        evt.preventDefault();
        setErrorMsj('');

        if(Number(evt.target.abono.value) > 0){
            let data = {
                id_pedido: order.id,
                id_cliente: order.id_cliente,
                adeudo: order.adeudo,
                abonado: evt.target.abono.value,
                estado: 0,
                chalan: null,
                fecha: evt.target.fecha.value,
                restante: evt.target.restante.value
            };
    
            
    
            if(evt.target.contra_entrega.value !== '0'){
                console.log('Contra entrega')
                data.estado = 1;
                data.chalan = evt.target.contra_entrega.value;
            }
    
            console.log(data)
    
            try {
                let res = await SP_API('http://localhost:3002/abono-nota', 'POST', data); 
                        
                if(res.error === false){
                    // initialFunction();
                    window.location.reload();
                }
    
                else{
                    alert('Error al pagar PCE chalan');
                }   
            } catch (error) {
                console.log(error);
            }
        }

        else{
            setErrorMsj('Error. Favor de ingresar una cantidad correcta.');
        }
    }

    const pagarAbono = async (evt, nota) => {
        evt.preventDefault();
        let pago_abono = evt.target.pago_abono.value;
        let id_abono = evt.target.id_abono.value;
        console.log(pago_abono);

        setErrorMsj('');

        if(Number(evt.target.pago_abono.value) > 0){
            let data = {
                id_abono,
                abonado: pago_abono,
                restante: evt.target.restante.value,
                id_pedido: nota.id
            };
    
            console.log(data);
            try {
                let res = await SP_API('http://localhost:3002/pagar-abono-nota', 'POST', data); 
                        
                if(res.error === false){
                    // initialFunction();
                    window.location.reload();
                }
    
                else{
                    alert('Error al pagar PCE chalan');
                }   
            } catch (error) {
                console.log(error);
            }
        }

        else{
            setErrorMsj('Error. Favor de ingresar una cantidad correcta.');
        }
    }

    const obtenerAbonos = async order_id => {
        try {
            let res = await SP_API('http://localhost:3002/abonos-nota/'+order_id, 'GET'); 
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

    const getAPCButtons = (abonos, nota) => {
        let apc_buttons = (abonos.filter(abono => abono.estado === 1)).map( abono => <ActionButton style={ {minWidth: '50px'} } className="bg-red" medium onClick={ () => { setAPCModalState({...APCModalState, visible: true, id_abono: abono.id}); setCurrentOrder(nota); setCurrentNumber(''+abono.abonado) }}>${abono.abonado} ({abono.chalan.split(',')[1]})</ActionButton>);
        return <div style={ {display: 'flex', justifyContent: 'space-between'} }>{ apc_buttons} </div>;
    };

    return(
        <Layout active='Notas'>
            <Container>
                <div style={ {display: 'flex', justifyContent: 'space-between'} }>
                    <h2>LISTA DE NOTAS</h2>
                    <Button className='bg-red' onClick={ () => window.location.reload() }>REINICIAR FILTROS</Button>
                </div>
                { filters ? (filters.chalan.length > 1 && filters.estado == 4 ? <Button className="bg-light-blue" onClick={ pagarPCEChalan}>RECIBIR PAGO TOTAL DE CHALAN</Button>: null) : null}

                <div style={ { overflowX: 'auto', marginTop: 20}}>
                    { clientDebt  || clientDebt >= 0? <p style={ {fontSize: 24, marginTop: 0} }>Deuda total de { filters.cliente.split(',')[1]}  = <strong>${ roundNumber(clientDebt) }</strong></p>: null }
                    {/* { filters.chalan !== '0' && filters.chalan ? <p style={ {fontSize: 20} }>Total APC chalan <strong>{filters.chalan.split(',')[1]}</strong> = <strong>${ roundNumber((filterData().filter( item => item.estado === 4).map( item => item.total_pagar)).reduce( (anterior, actual) => anterior + actual, 0)) }</strong> </p> : null} */}
                    {/*  tableData ? <TableWraper data={tableData} openEditModal={ openEditModal } openFiarModal={openFiarModal} /> : null  */} 
                    <StyledTable style={{ border: 'solid 1px #000' }}>

                        <thead style={ {backgroundColor: '#26C485'} }>
                            <tr>
                                <td><input type={'date'} style={ {padding: 10, fontSize: '16px'} } onChange={ (event) => setFilters({...filters, fecha: event.target.value }) }/> </td>
                                <td><select name="cliente" style={ {padding: 10, fontSize: '16px'} } onChange={ (event) => { setFilters({...filters, cliente: event.target.value }); mostrarDeudaTotal(event.target.value) }} >
                                        <option value='0'>Cliente</option>
                                        { clients ? clients.map( cliente => <option value={cliente.id + ',' + cliente.nombre}>{ cliente.nombre}</option>) : null };
                                    </select></td>
                                <td>
                                    <select name="chalan" style={ {padding: 10, fontSize: '16px'} } onChange={ (event) => setFilters({...filters, chalan: event.target.value }) } >
                                        <option value='0'>Chalan</option>
                                        { chalanes ? chalanes.map( chalan => <option value={chalan.id + ',' + chalan.nombre}>{ chalan.nombre}</option>) : null };
                                    </select>
                                </td>
                                <td>Total</td>
                                <td>
                                    <select name="orden_pedidos" style={ {padding: 10, fontSize: '16px'} } onChange={ (event) => setFilters({...filters, estado: Number(event.target.value) }) }>
                                        <option value='0'>Estado</option>
                                        <option value='4'>PCE</option>
                                        <option value='1'>Pagados</option>
                                        <option value='2'>Adeudos</option>
                                    </select>
                                </td>
                                <td>Acciones</td>
                                <td>Abonado</td>
                                <td>Restante</td>
                                <td>APC</td>
                            </tr>
                        </thead>
                        
                        <tbody>
                        { (tableData && estadoCaja ? 
                                filterData().map( (item, index) => {
                                    return <tr key={index}>
                                        <td>{ item.fecha }</td>
                                        <td>{ item.id_cliente } - { item.nombre_cliente }</td>
                                        <td><p> { item.chalan ? `${item.chalan.split(',')[0]} - ${item.chalan.split(',')[1]}` : null } </p> </td>
                                        <td>{'$'+ roundNumber(item.total_pagar) }</td>
                                        <td>{ getOrderStatusLabel(item) }</td>
                                        <td>
                                            <div style={ {display: 'flex', flexWrap: 'nowrap'} }>
                                                <ActionButton className="bg-primary" medium onClick={ () => openDetailModal(item) }>Detalle</ActionButton>
                                                <ActionButton className="bg-light-blue" ml medium onClick={ () => printTicket(item) }>Ticket</ActionButton>
                                                { estadoCaja.caja ?
                                                <>{ estadoCaja.caja.estado === 'abierta' ? (item.estado === 2 || item.estado === 3 ? <> <ActionButton className="bg-blue" medium ml onClick={ () => { setPaymentModalState({visible: true}); setCurrentOrder(item); console.log(item.adeudo)  } }>Recibir abono</ActionButton> </> : (item.estado === 4 ? <><ActionButton className="bg-blue" onClick={ () => openEditModal(item) } medium ml>Recibir pago</ActionButton> { item.id_cliente !== 0 ? <ActionButton className="bg-red"  onClick={ () => openFiarModal(item) } medium ml>Fiar </ActionButton> :null }</>: null)) : null}</>
                                                : null }
                                            </div>
                                        </td>
                                        <td>{ item.abonos ? (item.abonos.total_abonado ? '$'+item.abonos.total_abonado : '$0') : null}</td>
                                        <td>{ item.abonos ? (item.abonos.total_abonado ? item.adeudo - item.abonos.total_abonado: item.adeudo) : null}</td>
                                        <td>{ item.abonos ? (item.abonos.detalle_abonos ? getAPCButtons(item.abonos.detalle_abonos, item) : null) : null} </td>
                                    </tr> 
                                })
                            : null ) }
                        </tbody>
                    </StyledTable>
                </div>
            </Container>

            <Modal title='Mi titulo' visible={ modalState.visible }  handleModalClose={  handleModalClose } >
                { modalState.content }
            </Modal>

            {/* Payment Modal */}
            <Modal title='Payment modal' visible={ paymentModalState.visible }  handleModalClose={ () => { handlePaymentModalClose(); setCurrentNumber(''); setErrorMsj(''); } } >
                <ModalForm onSubmit={ event => abonar(event, currentOrder) }>
                    <FechaInput type={'date'} name='fecha' defaultValue={ currentDate ? currentDate.date : null }/>
                    <Total>Total adeudo: <strong>$ {currentOrder ? (currentOrder.abonos ? (currentOrder.abonos.total_abonado ? currentOrder.adeudo - currentOrder.abonos.total_abonado : currentOrder.adeudo) : currentOrder.adeudo ) : 0} </strong></Total>
                    <Change>Restante: <strong> $ {currentOrder ? (currentOrder.abonos ? (currentOrder.abonos.total_abonado ? (currentOrder.adeudo - currentOrder.abonos.total_abonado) - Number(currentNumber) : currentOrder.adeudo - Number(currentNumber) ) : currentOrder.adeudo - Number(currentNumber) ) : 0}</strong></Change>
                    <PaymentAmount>${ currentNumber ? currentNumber : '0'}</PaymentAmount>
                    <p style={ {fontSize: 26, color: 'red', textAlign: 'center'} }>{ errorMsj } </p>
                    <input type='hidden' value={currentNumber ? currentNumber : '0'} name='abono'/>
                    <input type='hidden' value={currentOrder ? (currentOrder.abonos ? (currentOrder.abonos.total_abonado ? (currentOrder.adeudo - currentOrder.abonos.total_abonado) - Number(currentNumber) : currentOrder.adeudo - Number(currentNumber) ) : currentOrder.adeudo - Number(currentNumber) ) : 0} name='restante'/>

                    <ContraEntrega>
                        { /* <h3 style={{ textAlign: 'center', fontSize: 20}}>Contra engrega <input type='checkbox' style={ {padding: '10px'} } onChange={ (event) => setContraEntrega(event.target.checked) } /></h3> */}
                        <h2>Contra entrega</h2>
                        { chalanesSelect }
                    </ContraEntrega>

                    <Keypad currentNumber={currentNumber} setCurrentNumber={setCurrentNumber} />

                    
                    <ModalButtons>
                        <Button type="submit" className="bg-primary">Pagar</Button>
                        <Button type="button" className="bg-red" onClick={ () => { handlePaymentModalClose(); setCurrentNumber(''); setErrorMsj(''); } }>Cancelar</Button>
                    </ModalButtons>
                </ModalForm>
            </Modal>

            {/* APC modal */}
            <Modal title='APC modal' visible={ APCModalState.visible }  handleModalClose={ () => { handleAPCModalClose(); setCurrentNumber(''); setErrorMsj('');} } >
                <ModalForm onSubmit={ event => pagarAbono(event, currentOrder) }>
                    <Total>Deuda restante: <strong>$ { currentOrder ? ((currentOrder.abonos.total_abonado ? currentOrder.adeudo - currentOrder.abonos.total_abonado: currentOrder.adeudo) - (currentNumber ? currentNumber : 0)) : null} </strong></Total>
                    <Total>Total de abono a pagar: <strong>$ { currentNumber ? currentNumber : '0'} </strong></Total>
                    {/* <Change>Cambio: <strong> $ { currentOrder ? ((Number(currentNumber) - currentOrder.total_pagar ) > 0 ? (Number(currentNumber) - currentOrder.total_pagar ) : 0).toFixed(2) : 0} </strong></Change> */}
                    <PaymentAmount>${ currentNumber ? currentNumber : '0'}</PaymentAmount>
                    <p style={ {fontSize: 26, color: 'red', textAlign: 'center'} }>{ errorMsj } </p>
                    <input type='hidden' name='pago_abono' value={currentNumber ? currentNumber : '0'} />
                    <input type='hidden' name='id_abono' value={ APCModalState.id_abono } />
                    <input type='hidden' name='restante' value={ currentOrder ? ((currentOrder.abonos.total_abonado ? currentOrder.adeudo - currentOrder.abonos.total_abonado: currentOrder.adeudo) - (currentNumber ? currentNumber : 0)) : null} />
                    {/* <input type='hidden' name='deuda_restante' value={ currentOrder ? ((currentOrder.abonos.total_abonado ? currentOrder.adeudo - currentOrder.abonos.total_abonado: currentOrder.adeudo)) : null} /> */}

                    <ContraEntrega style={ {display: 'none'} }>
                        <h2>Contra entrega</h2>
                        { chalanesSelect }
                    </ContraEntrega>

                    <Keypad currentNumber={currentNumber} setCurrentNumber={setCurrentNumber} />

                    
                    <ModalButtons>
                        <Button type="submit" className="bg-primary">Pagar</Button>
                        <Button type="button" className="bg-red" onClick={ () => { handleAPCModalClose(); setCurrentNumber(''); setErrorMsj('');} }>Cancelar</Button>
                    </ModalButtons>
                </ModalForm>
            </Modal>

                {/* Payment Modal (before adding recibe credit funcionality )
                        <Modal title='Payment modal' visible={ paymentModalState.visible }  handleModalClose={ () => { handlePaymentModalClose(); setCurrentNumber(''); } } >
                <ModalForm onSubmit={ event => payOrderPCE(event) }>
                    <Total>Total a pagar: <strong>$ { currentOrder ? currentOrder.total_pagar : 0} </strong></Total>
                    <Change>Cambio: <strong> $ { currentOrder ? ((Number(currentNumber) - currentOrder.total_pagar ) > 0 ? (Number(currentNumber) - currentOrder.total_pagar ) : 0).toFixed(2) : 0} </strong></Change>
                    <PaymentAmount>${ currentNumber ? currentNumber : '0'}</PaymentAmount>
                    <p style={ {fontSize: 26, color: 'red', textAlign: 'center'} }>{ errorMsj } </p>
                    <input type='hidden' value={currentNumber ? currentNumber : '0'} name='pago'/>
                    <input type='hidden' name='order_id' value={currentOrder ? currentOrder.id : null} />
                    <input type='hidden' name='total_pagar' value={currentOrder ? currentOrder.total_pagar : null} />
                    <ContraEntrega>
                        <h2>Contra entrega</h2>
                        { chalanesSelect }
                    </ContraEntrega>

                    <Keypad currentNumber={currentNumber} setCurrentNumber={setCurrentNumber} />

                    
                    <ModalButtons>
                        <Button type="submit" className="bg-primary">Pagar</Button>
                        <Button type="button" className="bg-red" onClick={ () => { handlePaymentModalClose(); setCurrentNumber(''); } }>Cancelar</Button>
                    </ModalButtons>
                </ModalForm>
            </Modal>
            */}

            <style>
                {`
                    .badge{
                        display: inline-block;
                        padding: 4px;
                        color: #000;
                        border-radius: 5px;
                    }

                    .badge-blue{
                        background-color: #048BA8;
                    }

                    .badge-red{
                        background-color: #FF6F59;
                    }

                    .badge-primary{
                        background-color: #26C485;
                    }
                `}
            </style>
        </Layout>
    );
}