class BranchSource(db.Model):
    __tablename__ = 'branchSource'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    branchId = db.Column(db.Integer, db.ForeignKey('Branch.id'))
    sourceTypeId = db.Column(db.Integer, db.ForeignKey('sourceType.id'))
    isActive = db.Column(db.Boolean, default=True)

    # Relationships
    branch = db.relationship('Branch', backref='branch_sources')
    source_type = db.relationship('SourceType', backref='branch_sources')

    def to_dict(self):
        return {
            'id': self.id,
            'branchId': self.branchId,
            'sourceTypeId': self.sourceTypeId,
            'isActive': self.isActive,
            'branchName': self.branch.branchName if self.branch else None,
            'sourceType': self.source_type.sourceType if self.source_type else None
        }

class BranchSourceName(db.Model):
    __tablename__ = 'branchSourceName'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    branchId = db.Column(db.Integer, db.ForeignKey('Branch.id'))
    sourceNameId = db.Column(db.Integer, db.ForeignKey('sourceName.id'))
    isActive = db.Column(db.Boolean, default=True)

    # Relationships
    branch = db.relationship('Branch', backref='branch_source_names')
    source_name = db.relationship('SourceName', backref='branch_source_names')

    def to_dict(self):
        return {
            'id': self.id,
            'branchId': self.branchId,
            'sourceNameId': self.sourceNameId,
            'isActive': self.isActive,
            'branchName': self.branch.branchName if self.branch else None,
            'sourceName': self.source_name.sourceName if self.source_name else None
        } 