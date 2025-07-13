import { Link } from 'react-router-dom';

import Button from './Button';

export default function Index() {
    return (
        <div id='setup-screen' className={`flex flex-col gap-5`}>
            <h2>What would you like to do?</h2>
            <div id='party-options' className={`flex flex-col gap-8 items-center md:flex-row md:justify-between`}>
                <Link to={`/UploadFile`}>
                    <Button buttonLabel={'Host party'} buttonClass={'primary'}></Button>
                </Link>
                <Link to={`/RecieverVideoPlayer`}>
                    <Button buttonLabel={'Join party'} buttonClass={'secondary'}></Button>
                </Link>
            </div>
        </div>
    );
}