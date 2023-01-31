import styled from "styled-components";
import SidebarItem from "./SidebarItem";

import { useState } from "react";

import { 
    faTh,
    faClipboardList,
    faClipboardCheck,
    faBoxes,
    faUserTie,
    faCashRegister,
    faShoppingBasket,
    faHandsHelping,
    faUserCog,
} from "@fortawesome/free-solid-svg-icons";

const SidebarContainer = styled.div`
    background-color: #CFDFE3;
    max-width: 220px;
    width: 100%;
    padding-top: 20px;
    height: 100%;
    position: fixed;
    overflow-y: scroll;
`;

const SidebarLogo = styled.div`
    font-size: 1.5rem;
    letter-spacing: 1rem;
    text-align: center;
    margin-bottom: 40px;
    font-weight: 400;
    &:hover{
        cursor: pointer;
    }
`;

const UserOptions = styled.div`
    position: absolute;
    left: 20px;
    display: flex;

    &:hover{
        display: block;
    }
    
    & ul{
        list-style: none;
        margin: auto;
        padding: 0px;
    }

    & li{
        display: block;
        width: 100%;
    }

    & li button{
        background: #000;
        color: #fff;
        padding: 8px;
        border: none;
        cursor: pointer;
        font-weight: 600;
    }
`;

export default function Sidebar(props){
    // console.log(Number(props.rol) === 1);
    const user_menu = [
        {
            name: 'Inicio',
            href: '/inicio',
            icon: faTh,
            submenu: false,
            admin: false
        },
        {
            name: 'Notas',
            href: '/notas',
            icon: faClipboardCheck,
            submenu: false,
            admin: false
        },
        {
            name: 'Productos',
            href: '/productos',
            icon: faBoxes,
            submenu: false,
            admin: true
        },
        {
            name: 'Clientes',
            href: '/clientes',
            icon: faUserTie,
            submenu: false,
            admin: false
        },
        /*{
            name: 'Envios',
            href: '/envios',
            icon: faShippingFast,
            submenu: false,
            admin: true
        },*/
        {
            name: 'Compras',
            href: '/compras',
            icon: faShoppingBasket,
            submenu: false,
            admin: false
        },
        {
            name: 'Chalanes',
            href: '/chalanes',
            icon: faHandsHelping,
            submenu: false,
            admin: true
        },
        {
            name: 'Proveedores',
            href: '/proveedores',
            icon: faBoxes,
            submenu: false,
            admin: true
        },
        {
            name: 'Usuarios',
            href: '/usuarios',
            icon: faUserCog,
            submenu: false,
            admin: true
        },
        {
            name: 'Caja',
            href: '/caja',
            icon: faCashRegister,
            submenu: false,
            admin: false
        },
        {
            name: 'Inventario',
            href: '/inventario',
            icon: faClipboardList,
            submenu: false,
            admin: true
        }
    ];

    const [optionVisible, setOptionsVisible] = useState(false);
    const toggleOptionsMenu= () => {
        setOptionsVisible(!optionVisible);
    };
    
    const logOut = () => {
        localStorage.removeItem('session-started');
        localStorage.removeItem('username');
        localStorage.removeItem('sp_rol');
        window.location.assign('/');
    };


    return(
        <SidebarContainer>
            <SidebarLogo  onClick={ toggleOptionsMenu }>
                { localStorage.getItem('username').toUpperCase() }
                { optionVisible ?
                <UserOptions className="hidden">
                    <ul>
                        <li><button onClick={ logOut }>Cerrar sesión</button></li>
                    </ul>
                </UserOptions>
                : null}
            </SidebarLogo>
            { Number(props.rol) === 1 
            ?
                user_menu.map( (item,index) => <SidebarItem active={props.active ===  item.name ? true : false} name={ item.name } href={ item.href } icon={ item.icon } key={index}  />) 
            :
                (user_menu.filter( item => !item.admin)).map( (item,index) => <SidebarItem active={props.active ===  item.name ? true : false} name={ item.name } href={ item.href } icon={ item.icon } key={index}  />) 
            }

            <style>
                {
                    `
                        .sidebar-item-active{
                            background-color: red;
                        }
                    `
                }
            </style>
        </SidebarContainer>
    );
}