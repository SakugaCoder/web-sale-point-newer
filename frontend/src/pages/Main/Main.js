import Layout from "../../components/Layout.";
import Button from "../../components/Button";
import UserPicture from "../../components/UserPicture";
import ProductCard from "./ProductCard";

import styled from 'styled-components';
import { useEffect, useState, useRef } from "react";

import Ticket from "../../components/Ticket";
import Modal from "../../components/Modal/Modal";

import useModal from "../../hooks/useModal";
import Keypad from "../../components/Keypad";
import { getItems, insertItem, SP_API } from "../../utils/SP_APPI";
import { getTotal, roundNumber } from "../../utils/Operations";
import './Main.css';

const MainContainer = styled.div`
    margin: 20px 20px 5px 10px;
`;

const Header = styled.header` 
    display: flex;
    justify-content: space-between;

    h2{
        width: 50%;
        text-align: center;
        font-weight: 700;
        font-size: 30px;
    }
`;

const CustomerStatus = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 70%;

    & select{
        padding: 10px 15px;
        font-size: 20px;
        border-radius: 40px;
    }

    & select option{
        font-size: 24px;
    }

    select::-ms-expand {
        display: none;
    }
`;

const CustomerData = styled.div`
    border: 2px solid #000;
    border-radius: 20px;
    padding: 5px;
    max-width: 350px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const CustomerDataItem = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-around;
    width: 100%;
    & > p{
        width: 40%;
    }

    & > strong{
        width: 40%;
    }
`;

const CustomerDataItemBascula = styled.div`
    display: flex;
    align-items: center;
    flex-direction: row;
    justify-content: space-around;
    width: 100%;
    background: #26C485;
    padding: 10px;
    border-radius: 10px;
    margin-left: 10px;

    p, strong{
        font-size: 30px;
    }
    & > p{
        width: 100%;
        text-align:center;
        margin: 5px auto;
    }

    & > strong{
        width: 100%;
        text-align:center;
    }
`;

const CustomerDataItemLeft = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    & > p{
        width: 40%;
    }

    & > strong{
        width: 40%;
    }
`;

const ProductContainer = styled.div`
    display: flex;
    max-height: calc(100vh - 180px);
`;

const ProductLeftSide = styled.div`
    width: 60%;
    display: flex;
    flex-direction: column;
`;

const ProductList = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    grid-column-gap: 10px;
    grid-row-gap: 10px;
    max-width: 100%;
    margin-top: 20px;
    height: 100%;
    overflow-y: scroll;
`;

const ButtonGroup = styled.div`
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
`;

const ProductCardModal = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;

    & img{
        margin: auto;
        max-width: 200px;
    }

    & strong{
        text-align: center;
        font-size: 20px;
        margin-bottom: 20px;
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

const ModalButtons = styled.div`
    display: flex;
    justify-content: space-between;
    margin-top: 20px;

    & button{
        width: 45%;
    }
`;

const Select = styled.div`
    display: block;
    width: 70%;
    margin: 20px auto;

    & select{
        width: 100%;
        padding: 10px;
        font-size: 18px;
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

const ContraEntrega = styled.div`
    display: none;
    margin: auto;

    h2{
        text-align: center;
        font-weight: normal;
        margin-bottom: 10px;
        font-size: 26px;
    }

    select{
        display: block;
        margin: auto;
        margin-bottom: 20px
    }
`;

const BasculaInfo = styled.div`
    p{
        margin-bottom: 2px;
        margin-top: 8px;
        font-size: 34px;
    }

    input[type='radio']{
        margin: 0;
        font: inherit;
        width: 1.15em;
        height: 1.15em;
        border: 0.15em solid currentColor;
        border-radius: 50%;
    }
`;

export default function Main(){
    let [products, setProducts] = useState([]);
    let [clients, setClients] = useState([]);
    let [chalanes, setChalanes] = useState([]);
    let [currentClient, setCurrentClient] = useState(null);
    let [currentDebt, setCurrentDebt] = useState(0);
    let [basket, setBasket] = useState([]);
    const { modalState: paymentModalState, setModalState: setPaymentModalState, handleModalClose: handlePaymentModalClose } = useModal();
    const { modalState: productModalState, setModalState: setProductModalState, handleModalClose: handleProductModalClose } = useModal();
    const { modalState, setModalState, handleModalClose } = useModal();
    const [ currentNumber, setCurrentNumber ] = useState('');
    const [ currentProduct, setCurrentProduct ] = useState(null);
    const [ restrictedMode, setRestrictedMode ] = useState(false);
    const [ kgInterval, setKgInterval] = useState(null);
    const [ finalKg, setFinalKg ] = useState(0);
    const [ currentKg, setCurrentKg] = useState(0);
    const [ scaleWeights, setScaleWeights] = useState({b1: 0, b2:0, b3:0});
    const [ contraEntrega, setContraEntrega ] = useState(false);
    const [ cashRegister, setCashRegister ] = useState(null);
    const [ paymentError, setPaymentError ]  = useState('');
    const [ errorBascula, setErrorBascula ] = useState(null);
    const [ errorMsj, setErrorMsj ] = useState('');
    
    const [ kgPrice, setKgPrice ] = useState('');
    const [ kgWeight, setKgWeight ] = useState('');
    const [ kgTara, setKgTara ] = useState('');

    const [ pzaPrice, setPzaPrice ] = useState('');
    const [ pzaQty, setPzaQty ] = useState('');

    const [ currentInputState, setCurrentInputState ] = useState([]);

    let counter = 0;

    const selectClientRef = useRef(null);

    const getCurrentKg = async () => {
        let res_kg = await SP_API('http://localhost:3002/bascula', 'GET');
        if(res_kg.kg_bascula === -100){
            console.log('Error en bascula')
            if(counter === 0){
                setCurrentKg('Error');
                // console.log('Ok no entra aqui')
                setModalState({visible: true, content: errorBasculaModal()});
                counter = 10;
            }
        }

        else{
            // setCurrentKg(res_kg.kg_bascula);
            setScaleWeights({b1: res_kg.kg_bascula, b2: 0 , b3: 0});
            counter = 0;
        }
        // else{
        //     console.log('Buena lectura en bascula');
        //     if(errorBascula === true){
        //         console.log('Error definido')
        //         setErrorBascula(false);
        //     }
        //     setCurrentKg(res_kg.kg_bascula);

        // }
        // setCurrentKg( roundNumber((Math.random() * 10)));
    };

    const errorBasculaModal = () => {
        return <div className="product-card-modal">

        <p style={ {fontSize: 26, color: 'red'} }>Error de comunicación. Reconectar báscula y reiniciar programa.</p>
        <Button className="bg-white" type="button" onClick={ handleModalClose }>Aceptar</Button>
    </div>
    };

    const getProducts = async () => {
        let products = await getItems('Productos');

        function compare( a, b ) {
            if ( a.name.toLowerCase() < b.name.toLowerCase() ){
              return -1;
            }

            if ( a.name.toLowerCase() > b.name.toLowerCase() ){
              return 1;
            }
            return 0;
        }
          
        let r = products.sort( compare );
        setProducts(r);
        console.log(r);
    };

    const getClients = async () => {
        let products = await getItems('Clientes');
        setClients(products);
        console.log(products);
    };

    const getChalanes = async () => {
        let chalanes = await getItems('Chalanes');
        setChalanes(chalanes);
        // console.log(products);
    };

    const getCashRegister = async () => {
        let cash_register = await SP_API('http://localhost:3002/estado-caja', 'GET');
        console.log(cash_register);
        if(!cash_register.caja){
            setModalState({visible: true, content: alertModal('Favor de abrir caja para realizar pedidos') });
        }
        else if(cash_register.caja.estado === 'cerrada'){
            setModalState({visible: true, content: alertModal('Caja cerrada. Favor de abrir la caja el dia siguiente para realizar pedidos') });
        }

        setCashRegister(cash_register);
        // console.log(products);
    };

    const onChangeSelect = async evt => {
        if(evt.target.value){
            let client_data = evt.target.value.split(',');
            setCurrentDebt(0);
            setCurrentClient({id: client_data[0], name: client_data[1], debt: client_data[2] ? client_data[2] : 0});
            if(Number(client_data[0]) === 0){
                setRestrictedMode(true);
            }

            else{
                // Get client debt
                let res = await SP_API('http://localhost:3002/deuda-usuario/'+client_data[0], 'GET');
                if(res){
                    setCurrentDebt(roundNumber(Number(res[0].deuda_cliente) - Number(res[1].total_abonado) ));
                }
                console.log(res);
                setRestrictedMode(false);
            }
        }
        else{
            setCurrentClient(null);
        }    
    };

    const clearBasket = () => setBasket([]);

    const payOrder = async (evt, trusted = false) => {
        evt.preventDefault();
        let payment = Number(evt.target.pago.value);
        if(evt.target.contra_entrega){
            if(Number(evt.target.contra_entrega.value) !== 0){
                console.log('pago contra entrega');
                let order = {
                    total: Number(getTotal(basket)),
                    payment: Number(getTotal(basket)),
                    items: basket,
                    client: currentClient,
                    estado: 4,
                    efectivo: null,
                    cajero: localStorage.getItem('username'),
                    cajero_id: localStorage.getItem('sp_user_id'),
                    chalan: evt.target.contra_entrega.value,
                    date:  (new Date().toISOString().split(':')[0]).split('T')[0]
                }
    
                let res = await insertItem('pedido', order);
                if(res.err === false){
                    window.location.reload();
                }
                
                console.log(res);
                console.log(order);
                handleModalClose();
            }

            else{
                if(getTotal(basket) <= payment){
                    console.log('pago normal');
                    let order = {
                        total: Number(getTotal(basket)),
                        payment: Number(getTotal(basket)),
                        items: basket,
                        client: currentClient,
                        estado: 1,
                        chalan: null,
                        efectivo: payment,
                        cajero: localStorage.getItem('username'),
                        cajero_id: localStorage.getItem('sp_user_id'),
                        date:  (new Date().toISOString().split(':')[0]).split('T')[0]
                    }

        
                    let res = await insertItem('pedido', order);
                    if(res.err === false){
                        window.location.reload();
                    }
                    console.log(res);
                    console.log(order);
                    handleModalClose();
                }

                else{
                    setPaymentError('La cantidad ingresada para el pago no es valida. Favor de verificar.');
                    setCurrentNumber('');
                    console.log('Ingresa una cantidad correcta');
                }
            }
        }

        else{
            console.log('fiado');
            // alert('Error al procesar el pago. Favor de especificar una cantidad mayor o igual al total');
            let order = {
                total: Number(getTotal(basket)),
                payment,
                items: basket,
                client: currentClient,
                estado: 2,
                chalan: null,
                efectivo: null,
                cajero: localStorage.getItem('username'),
                cajero_id: localStorage.getItem('sp_user_id'),
                date:  (new Date().toISOString().split(':')[0]).split('T')[0]
            }

            let res = await insertItem('pedido', order);
            if(res.err === false){
                window.location.reload();
            }
            console.log(res);
            console.log(order);
            handleModalClose();
        }
    };

    const addProductToBasket = (evt, item_data) => {
        setErrorMsj('');
        evt.preventDefault();
        let kg = Number(evt.target.kg.value);
        let net_weight = Number(evt.target.net_weight.value);
        
        if(net_weight <= 0){
            setErrorMsj("Error. El valor de la tara no puede ser mayor al peso.");
            return null;
        }

        if(kg > 0){
            item_data.kg = kg;
            
            if(net_weight > 0){
                item_data.kg = net_weight;
            }
        }
        else{
            item_data.kg = currentKg;
        }

        if(item_data.venta_por === 'kg'){
            if(kgPrice && kgPrice !== '0'){
                item_data.price = Number(kgPrice);
            }
        }

        else{
            if(pzaPrice && pzaPrice !== '0'){
                item_data.price = Number(pzaPrice);
            }
        }



        // else{
        //     setErrorMsj('Error. Favor de introducir una cantidad valida.');
        //     // item_data.kg = currentNumber;
        //     return null;
        // }

        console.log(item_data.kg);
        console.log(item_data);
        let item_exists = basket.find( basket_item => basket_item.id === item_data.id);
        if(item_exists){
            let new_basket = basket.map(basket_item => {
                if(basket_item.id === item_data.id){
                    console.log('econtrado, basket kg: '+ basket_item.kg, ' item kg: '+item_data.kg);
                    return {
                        ...basket_item,
                        kg: basket_item.kg + item_data.kg
                    };
                }
                return basket_item;
            });
            setBasket(new_basket);
        }

        else{
            setBasket([item_data, ...basket]);
        }
        
        handleProductModalClose();
        setCurrentNumber('');
        clearProductModal();
        evt.target.reset();
        return null;
    };

    const addProductToBasketHidden = item_data => {
        if(currentKg !== 'Error'){
            item_data.kg = roundNumber(Number(currentKg));
            // console.log(item_data.kg);
            let item_exists = basket.find( basket_item => basket_item.id === item_data.id);
            if(item_exists){
                let new_basket = basket.map(basket_item => {
                    if(basket_item.id === item_data.id){
                        console.log('econtrado, basket kg: '+ basket_item.kg, ' item kg: '+item_data.kg);
                        return {
                            ...basket_item,
                            kg: Number(basket_item.kg) + Number(currentKg)
                        };
                    }
                    return basket_item;
                });
                setBasket(new_basket);
            }
    
            else{
                setBasket([item_data, ...basket]);
            }
            setCurrentNumber('');
        }
        return null;
    };

    const alertModal = msj => {
        return <ProductCardModal>
            <p style={ {fontSize: 20} }>{ msj }</p>

            <ModalForm onSubmit={ handleModalClose } style={ {display: 'flex', justifyContent: 'center'} }>
                <Button type='submit' className="bg-primary">Entendido</Button>
            </ModalForm>
            
        </ProductCardModal>
    }

    const openProductModal = product_data => {
        setCurrentProduct(product_data);
        if(currentClient){
            if(currentKg > 0){
                
                console.log(product_data);
                if(product_data.venta_por === 'kg'){
                    setCurrentInputState('kgPrice');
                }

                else if(product_data.venta_por === 'pza'){
                    setCurrentInputState('pzaQty');
                }
                // if(product_data.venta_por === 'kg'){
                //     console.log(currentKg);
                //     if((Number(currentKg)).toFixed(2) <= 0){
                //         return null;
                //     }
                //     else{
                //         addProductToBasketHidden(product_data);
                //     }
                // }
    
                // else if(product_data.venta_por === 'pza'){
                //     setProductModalState({visible: true});
                // }
                setProductModalState({visible: true});
            }

            else{
                setModalState({visible: true, content: alertModal('El peso no puede ser 0, verifique su bascula')});

            }

        }

        else{
            setModalState({visible: true, content: alertModal('Por favor seleccionar cliente primero')});
        }
    };

    const paymentModalContent = trusted => {
        return <ProductCardModal>
            { !trusted ? 
                null
            :

            <ModalForm onSubmit={ event => payOrder(event, true) }>

                <p style={ {marginBottom: 20, textAlign: 'center', fontSize: 18} }>Confirma que se va a fiar <strong>${ getTotal(basket)}</strong>  al cliente <strong>{currentClient.name} </strong></p>
                <input type='hidden' defaultValue='0' name='pago'/>
                <ModalButtons>
                    <Button type='submit' className="bg-primary">Fiar</Button>
                    <Button className="bg-red" onClick={ handleModalClose }>Cancelar</Button>
                </ModalButtons>
            </ModalForm>
        }
            
        </ProductCardModal>
    };

    const openPaymentModal = is_trusted => {
        if(currentClient && basket.length > 0){
            if(is_trusted){
                setModalState({visible: true, content: paymentModalContent(is_trusted)});
            }

            else{
                setPaymentModalState({visible: true, content: null});
            }
        }

        else{
            alert('Por favor agrege productos a la canasta');
        }
    };

    const chalanesSelect = chalanes ? <select name='contra_entrega' style={ {fontSize: 24, padding: 5} }>
        <option style={ {fontSize: 24} }  value='0'>Seleccionar chalan</option>
        { chalanes.map( chalan => <option style={ {fontSize: 24} } value={chalan.id + ',' + chalan.nombre}>{ chalan.nombre}</option>) }
    </select> : null;

    const resetSelect = () => {
        selectClientRef.current.selectedIndex = 0;
    };

    const openDeleteItemModal = product_data => {
        setModalState({visible: true, content: deleteItemModal(product_data)});
    };

    const deleteItem = (evt, item) => {
        evt.preventDefault();
        setBasket(basket.filter(basket_item => basket_item.id !== item.id));
        console.log('deleting item', item);
        setModalState({visible: false, content: null});

    }

    const deleteItemModal = item => {
        return <div className="product-card-modal">

        <p style={ {fontSize: 24}}>Confirma eliminar <strong style={ {fontSize: 24}}>{ item.name} x {item.kg} kg</strong> del pedido</p>

        <form className="modal-form" onSubmit={  event => deleteItem(event, item) }>
            <div className="modal-buttons">
                <Button className="bg-red" type='submit'>Eliminar</Button>
                <Button className="bg-white" onClick={ handleModalClose }>Cancelar</Button>
            </div>
        </form>
    </div>
    };

    const addValueToInput = (val, bs) => {
        console.log(currentInputState);
        let new_number = val[val.length -1 ];

        
        if(currentInputState === 'kgPrice'){
            if(bs)
                setKgPrice(kgPrice.substring(0, kgPrice.length - 1));
            else
                setKgPrice(kgPrice + new_number);
        }

        if(currentInputState === 'kgWeight'){
            if(bs)
                setKgWeight(kgWeight.substring(0, kgPrice.length - 1));
            else
                setKgWeight(kgWeight + new_number);
        }

        if(currentInputState === 'tara'){
            if(bs)
                setKgTara(kgTara.substring(0, kgTara.length - 1));
            else
                setKgTara(kgTara + new_number);
        }

        if(currentInputState === 'pzaPrice'){
            if(bs)
                setPzaPrice(pzaPrice.substring(0, pzaPrice.length - 1));
            else
                setPzaPrice(pzaPrice + new_number);
        }

        if(currentInputState === 'pzaQty'){
            if(bs)
                setPzaQty(pzaQty.substring(0, pzaQty.length - 1));
            else
                setPzaQty(pzaQty + new_number);
        }
    }

    const getNetWeight = () =>{
        let final_weight = currentKg;
        let tara = 0;
        if(kgWeight && kgWeight !== '0')
            final_weight = kgWeight;

        if(kgTara && kgTara !== '0')
            tara = kgTara; 
        
        return roundNumber( Number(final_weight) - Number(tara));
    }

    const getTotalCost = product_price => {
        let net_weight = getNetWeight();

        if(kgPrice && kgPrice !== '0')
            return  Number(net_weight) * Number(kgPrice);

        return roundNumber(Number(net_weight) * Number(product_price));
    }

    const getTotalCostPza = () => {

    }


    const clearProductModal = () =>{
        setKgPrice('');
        setKgWeight('');
        setKgTara('');
        setPzaPrice('');
        setPzaQty('');
    }

    const changeScale = evt => {
        let scale_selected = evt.target.value;
        let scale_weight = scaleWeights[scale_selected];
        setCurrentKg(scale_weight);
        console.log(scale_weight);
        if(scale_weight === 0){
            setModalState({visible: true, content: alertModal("El peso no puede ser 0, verifique su bascula") });
        }
    }
    
    useEffect( () => {
        getProducts();
        getClients();
        getChalanes();
        getCashRegister();
        setKgInterval(setInterval(getCurrentKg, 900));
    }, []);


    const handleKeyboard = (evt, value, setValue) =>{
        console.log(evt.target.value);
        if(evt.target.value.length < value.length){
            setValue(evt.target.value);
        }
        else{
            setValue(value + (evt.target.value.substring(evt.target.value.length - 1, evt.target.value.length)) );
        }
        
    }


    return(
        <Layout active='Inicio'>
            <MainContainer>
            { cashRegister ? ( cashRegister.caja ? cashRegister.caja.estado === 'abierta' ? 
                <>
                <Header>
                    <CustomerStatus>
                        <CustomerData>
                            <CustomerDataItem>
                                <strong>Cliente:</strong>
                                    <select className="" style={ {background: '#CFDFE3'} } ref={ selectClientRef }  onChange={ onChangeSelect }>
                                    <option value={''}>SELECCIONAR CLIENTE</option>
                                    <option value={'0,Cliente de paso,0'}>CLIENTE DE PASO</option>
                                    { clients ? clients.map(client => <option value={ `${client.id},${client.nombre},${client.adeudo}` }> {client.nombre} </option>) : null}
                                </select>
                            </CustomerDataItem>

                            <CustomerDataItemLeft>
                                <strong>Deuda:</strong>
                                <p style={ { fontSize:28 } }>{ currentDebt ?'$'+ currentDebt : '$0'} </p>
                            </CustomerDataItemLeft>

                        </CustomerData>
                        <CustomerDataItemBascula>  
                                <label htmlFor="b1">
                                    <BasculaInfo>
                                        <input type='radio' name="selected-scale" value="b1" id="b1" onChange={ changeScale }/>
                                        <p>B1:</p>
                                        <strong>{ currentKg !== 'Error' ? scaleWeights.b1 + 'kg' : 'Error' } </strong>
                                    </BasculaInfo>
                                </label>

                                <label htmlFor="b2">
                                    <BasculaInfo>
                                        <input type='radio' name="selected-scale" value="b2" id="b2" onChange={ changeScale }/>
                                        <p>B2:</p>
                                        <strong>{ scaleWeights.b2 } kg</strong>
                                    </BasculaInfo>
                                </label>

                                <label htmlFor="b3">
                                    <BasculaInfo>
                                    <input type='radio' name="selected-scale" value="b3" id="b3" onChange={ changeScale }/>
                                        <p>B3:</p>
                                        <strong>{ scaleWeights.b3 } kg</strong>
                                    </BasculaInfo>
                                </label>
                        </CustomerDataItemBascula>

                    </CustomerStatus>

                    <h2>Pedido</h2>
                </Header>

                <ProductContainer>
                    <ProductLeftSide>
                        <ProductList>
                            { products ? products.map( (product, index) => <ProductCard key={index} handleOnClick={ () => openProductModal(product) } img={ product.img } price={ product.price } name={ product.name } /> ) : null }
                        </ProductList>
                        {/*
                        <ButtonGroup>
                            <Button color={'blue'} className="bg-blue lg-p" onClick={ printPageArea }>TICKET</Button>
                            <Button color={'black'} className="bg-black lg-p" onClick={ openShippingModal } >ENVIAR</Button>
                        </ButtonGroup>
                        */
                        }
                    </ProductLeftSide>
                    
                    <Ticket items={ basket } openPaymentModal={openPaymentModal} cancelOrder={ () => { clearBasket(); setCurrentClient(null); setCurrentDebt(0); resetSelect(); } } payOrder={ () => openPaymentModal(false) } restrictedMode={ restrictedMode } onClickItem={openDeleteItemModal}/>
                </ProductContainer>
                </>
                : null : null ) : null}
            </MainContainer>

            { /* Inmutable modal */}
            <Modal title='Custome modal' visible={ modalState.visible }  handleModalClose={  handleModalClose } >
                { modalState.content }
            </Modal>

            {/* Payment Modal */}
            <Modal title='Payment modal' visible={ paymentModalState.visible }  handleModalClose={ () => { handlePaymentModalClose(); setCurrentNumber(''); } } >
                <ModalForm onSubmit={ event => payOrder(event) }>
                    <Total>Total a pagar: <strong>${ getTotal(basket)} </strong></Total>
                    <Change>Cambio: <strong>${ currentNumber ? ( Number(currentNumber) - Number(getTotal(basket)) > 0 ? roundNumber(Number(currentNumber) - Number(getTotal(basket) )) : '0' ) : '0'} </strong></Change>
                    <PaymentAmount>${ currentNumber ? currentNumber : '0'}</PaymentAmount>
                    <input type='hidden' value={currentNumber ? currentNumber : '0'} name='pago'/>

                    <div>{paymentError ? <p style={ {fontSize: 24, color: 'red', textAlign: 'center'} }>{paymentError}</p> : null}</div>
                    <ContraEntrega>

                        <h2>Pago contra entrega</h2>
                        { chalanesSelect }
                    </ContraEntrega>

                    <Keypad currentNumber={currentNumber} setCurrentNumber= { (val) => {setCurrentNumber(val);  setPaymentError('') }} />
                    
                    <ModalButtons>
                        <Button type="submit" className="bg-primary">Pagar</Button>
                        <Button type="button" className="bg-red" onClick={ () => { handlePaymentModalClose(); setCurrentNumber('');  } }>Cancelar</Button>
                    </ModalButtons>
                </ModalForm>
            </Modal>

            {/* Product card modal */}
            <Modal title='Product card modal' visible={ productModalState.visible }  handleModalClose={  () => { handleProductModalClose(); setCurrentNumber(''); setErrorMsj('');clearInterval(kgInterval); } } >
                { currentProduct ? 
                    <ProductCardModal>
                        <img src={currentProduct.img }/>

                        <p style={ {fontSize: 26} }>{ currentProduct.name }</p>
                        {/* <strong style={ {fontSize: 36} }>$ { currentProduct.price } x  1 {currentProduct.venta_por}</strong> */}

                        <p style={ {fontSize: 26, color: 'red'} }>{ errorMsj }</p>

                        <ModalForm onSubmit={ event => { addProductToBasket(event, currentProduct); }}>
                            { /* <Input placeholder='Cantidad en kg' label='Cantidad en kilogramos' name='kg' required/> */}
                            {/* <input type='hidden' value={ currentNumber } name='kg'/> */}
                            {/* 
                                <PaymentAmount>En bascula: { currentKg } kg</PaymentAmount>
                                <PaymentAmount>Peso total: { finalKg } kg</PaymentAmount>
                            */}
{/* 
                            <PaymentAmount style={ {marginTop:5, marginBottom: 5}}>Total: ${ currentNumber ? currentNumber*currentProduct.price : '0'}</PaymentAmount>
                            <PaymentAmount style={ {marginTop:5}}>Piezas: { currentNumber ? currentNumber : '0'}</PaymentAmount> */}
                            {
                                currentProduct.venta_por === 'kg'
                                ?
                                    <table className="product-info">
                                        <tbody>
                                            <tr>
                                                <td><h3>Precio x {currentProduct.venta_por}</h3></td>
                                                <td><input type='text' placeholder={currentProduct.price} value={kgPrice} onChange={ (event) => handleKeyboard(event, kgPrice, setKgPrice) }  defaultValue={currentProduct.precio} onFocus={ () => setCurrentInputState('kgPrice') }></input></td>
                                            </tr>

                                            <tr>
                                                <td><h3>Peso bruto</h3></td>
                                                <td><input type='text' placeholder={currentKg} name='kg' value={kgWeight} onChange={ (event) => handleKeyboard(event, kgWeight, setKgWeight) } onFocus={ () => setCurrentInputState('kgWeight') } autoComplete='off'></input></td>
                                            </tr>

                                            <tr>
                                                <td><h3>Tara</h3></td>
                                                <td><input type='text' placeholder={'0'} value={kgTara} onChange={ (event) => handleKeyboard(event, kgTara, setKgTara) } onFocus={ () => setCurrentInputState('tara') }></input></td>
                                            </tr>

                                            <tr>
                                                <td><h3>Peso neto</h3></td>
                                                <td><p>{ getNetWeight() } kg</p></td>
                                                <input type={'hidden'} value={ getNetWeight() } name='net_weight'></input>
                                            </tr>

                                            <tr>
                                                <td><h3>Total</h3></td>
                                                <td><p>$ { getTotalCost(currentProduct.price) } </p></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                : 
                                    <table className="product-info">
                                    <tbody>
                                        <tr>
                                            <td><h3>Precio x {currentProduct.venta_por}</h3></td>
                                            <td><input type='text'  placeholder={currentProduct.price} value={pzaPrice} onChange={ (event) => handleKeyboard(event, pzaPrice, setPzaPrice) } defaultValue={currentProduct.precio} onFocus={ () => setCurrentInputState('pzaPrice') }></input></td>
                                        </tr>

                                        <tr>
                                            <td><h3>Piezas</h3></td>
                                            <td><input type='text' name={'kg'} value={pzaQty} onChange={ (event) => handleKeyboard(event, pzaQty, setPzaQty) } defaultValue={1} onFocus={ () => setCurrentInputState('pzaQty') }></input></td>
                                        </tr>

                                        <tr>
                                            <td><h3>Total</h3></td>
                                            <td><p>$ { getTotalCostPza(currentProduct.price) } </p></td>
                                        </tr>
                                    </tbody>
                                </table>
                            }

                            <Keypad currentNumber={currentNumber} setCurrentNumber={ (val, backspace) => { setCurrentNumber(val); addValueToInput(val, backspace); setErrorMsj('') }} />



                            <ModalButtons>
                                    <Button type='button' className="bg-red" onClick={ () => { handleProductModalClose(); setCurrentNumber(''); setErrorMsj(''); clearProductModal(); } }>Cancelar</Button>
                                    {/* <Button className="bg-blue ml" type='button' onClick={ () => { setFinalKg(finalKg+currentKg)} }>Agregar peso</Button> */}
                                    <Button type='submit' className="ml bg-primary">Guardar</Button>
                            </ModalButtons>

                            {
                            /* 
                                <Keypad currentNumber={currentNumber} setCurrentNumber={setCurrentNumber} />

                            */
                            }
                        </ModalForm>
                    </ProductCardModal>
                : null }
            </Modal>
        </Layout>
    );
};