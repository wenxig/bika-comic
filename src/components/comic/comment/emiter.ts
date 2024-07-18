import mitt from 'mitt';

type Events = {
  childrenCommitReload: [id: string]
  commitReload: []
}
export default mitt<Events>()