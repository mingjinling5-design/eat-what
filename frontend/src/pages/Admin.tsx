function Admin() {
  return (
    <section className="page-stack">
      <div className="section-card">
        <div className="section-head">
          <div>
            <p className="section-kicker">Admin</p>
            <h2>管理后台</h2>
          </div>
          <span className="pill">体验版</span>
        </div>

        <div className="admin-grid">
          <div className="admin-card">
            <span>🏫</span>
            <h3>学校管理</h3>
            <p>后期支持多学校、多单位扩展。</p>
          </div>

          <div className="admin-card">
            <span>🍱</span>
            <h3>菜品管理</h3>
            <p>维护菜品名称、分类、价格、口味标签。</p>
          </div>

          <div className="admin-card">
            <span>📋</span>
            <h3>今日菜单</h3>
            <p>管理员可以录入每日食堂菜单。</p>
          </div>

          <div className="admin-card">
            <span>📊</span>
            <h3>反馈统计</h3>
            <p>查看用户反馈、热门菜品和推荐数据。</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Admin;