const {StyleSheet, css} = aphrodite;

export default class Foo extends React.Component {
    render() {
        return <h1 className={css(styles.title)}>
            Hello, world
        </h1>;
    }
}

const styles = StyleSheet.create({
    title: {
      fontSize: 64,
    },
});
