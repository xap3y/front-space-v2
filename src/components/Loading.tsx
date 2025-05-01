import {Riple} from "react-loading-indicators";

export default function Loading() {
    return (
        <div className={"text-center m-auto"}>
            <Riple color="#32cd32" size="large" easing={"ease-in-out"} text="" textColor=""/>
        </div>
    );
}