import styled from 'styled-components';
import Sidebar from './Sidebar';

const LayoutContainer = styled.div`
    width: 100%;
    display: flex;
    
`;

const MainContainer = styled.div`
    width: 100%;
    padding-left: 220px;
`;

export default function Layout(props){

    let session = localStorage.getItem('session-started');
    let rol = localStorage.getItem('sp_rol');

    if(!session){
        window.location.assign('/');
    }

    return(
        <LayoutContainer>
            <Sidebar active={props.active} rol={ rol } />
            <MainContainer>
                { props.children }
            </MainContainer>
        </LayoutContainer>
    );
}