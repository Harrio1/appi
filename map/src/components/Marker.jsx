import React from 'react';
import { Marker as LeafletMarker } from 'react-leaflet';

class Marker extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            position: props.position
        };
    }

    handleDragEnd = (event) => {
        const newPosition = event.target.getLatLng();
        this.setState({ position: newPosition });
        if (this.props.onDragEnd) {
            this.props.onDragEnd(newPosition, this.props.index);
        }
    };

    handleDoubleClick = () => {
        if (this.props.onDoubleClick) {
            this.props.onDoubleClick(this.props.index);
        }
    };

    render() {
        return (
            <LeafletMarker
                position={this.state.position}
                draggable={true}
                onDragend={this.handleDragEnd}
                onDblclick={this.handleDoubleClick}
            />
        );
    }
}

export default Marker;
