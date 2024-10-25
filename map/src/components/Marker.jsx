import React from 'react';

class Marker extends React.Component {
    constructor(props) {
        super(props);
        // Инициализация состояния
        this.state = {
            // ... начальное состояние ...
        };
    }

    componentDidMount() {
        // Перенесите сюда код с побочными эффектами из componentWillMount
    }

    componentDidUpdate(prevProps) {
        // Перенесите сюда код из componentWillReceiveProps
        // Например, если вы обновляете состояние на основе изменения props
        if (this.props.someProp !== prevProps.someProp) {
            // ... обновление состояния ...
        }
    }

    // Удалите или переименуйте устаревшие методы
    // UNSAFE_componentWillMount() {
    //     // ... код, который был в componentWillMount ...
    // }

    // UNSAFE_componentWillReceiveProps(nextProps) {
    //     // ... код, который был в componentWillReceiveProps ...
    // }

    render() {
        // ... рендеринг компонента ...
    }
}
