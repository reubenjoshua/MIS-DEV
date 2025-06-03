from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'User'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    roleId = db.Column(db.Integer, db.ForeignKey('Role.id'))
    areaId = db.Column(db.Integer, db.ForeignKey('Area.id'))
    branchId = db.Column(db.Integer, db.ForeignKey('Branch.id'))
    # Remove dailyEncoded and monthlyEncoded columns if present
    userName = db.Column(db.String(64))
    firstName = db.Column(db.String(64))
    lastName = db.Column(db.String(64))
    email = db.Column(db.String(64))
    passwordHash = db.Column(db.String(64))
    isActive = db.Column(db.Boolean)

    # Relationship to Daily records encoded by this user
    daily_records = db.relationship(
        'Daily',
        back_populates='encoder',
        foreign_keys='Daily.byUser',
        lazy='dynamic',
        overlaps="dailies"
    )

    @property
    def dailyEncoded(self):
        return self.daily_records.count()

    def to_dict(self):
        from models import Role, Area, Branch
        role = Role.query.get(self.roleId)
        area = Area.query.get(self.areaId)
        branch = Branch.query.get(self.branchId)
        return {
            'id': self.id,
            'roleId': self.roleId,
            'roleName': role.roleName if role else None,
            'areaId': self.areaId,
            'areaName': area.areaName if area else None,
            'branchId': self.branchId,
            'branchName': branch.branchName if branch else None,
            'firstName': self.firstName,
            'lastName': self.lastName,
            'email': self.email,
            'isActive': self.isActive,
            'username': self.userName,
            'dailyEncoded': self.dailyEncoded
        }

class Role(db.Model):
    __tablename__ = 'Role'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    roleName = db.Column(db.String(64))
    description = db.Column(db.String(256))

class Area(db.Model):
    __tablename__ = 'Area'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    areaCode = db.Column(db.Integer, nullable=False)
    areaName = db.Column(db.String(64))
    isActive = db.Column(db.Boolean)

class Branch(db.Model):
    __tablename__ = 'Branch'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    areaId = db.Column(db.Integer, db.ForeignKey('Area.id'))
    branchName = db.Column(db.String(64))
    isActive = db.Column(db.Boolean)

class Daily(db.Model):
    __tablename__ = 'Daily'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    monthlyId = db.Column(db.Integer, db.ForeignKey('Monthly.id'))
    sourceType = db.Column(db.Integer, db.ForeignKey('sourceType.id'))
    sourceName = db.Column(db.Integer, db.ForeignKey('sourceName.id'))
    status = db.Column(db.Integer, db.ForeignKey('Status.id'))
    byUser = db.Column(db.Integer, db.ForeignKey('User.id'))
    date = db.Column(db.DateTime)
    productionVolume = db.Column(db.Float)
    operationHours = db.Column(db.Float)
    serviceInterruption = db.Column(db.Float)
    totalHoursServiceInterruption = db.Column(db.Float)
    electricityConsumption = db.Column(db.Float)
    VFDFrequency = db.Column(db.Float)
    spotFlow = db.Column(db.Float)
    spotPressure = db.Column(db.Float)
    timeSpotMeasurements = db.Column(db.Float)
    lineVoltage1 = db.Column(db.Float)
    lineVoltage2 = db.Column(db.Float)
    lineVoltage3 = db.Column(db.Float)
    lineCurrent1 = db.Column(db.Float)
    lineCurrent2 = db.Column(db.Float)
    lineCurrent3 = db.Column(db.Float)
    comment = db.Column(db.String(512))
    isActive = db.Column(db.Boolean)
    branchId = db.Column(db.Integer, db.ForeignKey('Branch.id'))
    areaId = db.Column(db.Integer, db.ForeignKey('Area.id'))

    # Relationships
    monthly = db.relationship('Monthly', backref='dailies')
    source_type = db.relationship('SourceType', backref='dailies')
    source_name = db.relationship('SourceName', backref='dailies')
    status_rel = db.relationship('Status', backref='dailies')
    encoder = db.relationship('User', back_populates='daily_records', foreign_keys=[byUser], overlaps="dailies")
    branch = db.relationship('Branch', backref='dailies')
    area = db.relationship('Area', backref='dailies')

    def to_dict(self):
        return {
            'id': self.id,
            'monthlyId': self.monthlyId,
            'monthlyName': self.monthly.name if self.monthly else None,
            'sourceType': self.sourceType,
            'sourceTypeName': self.source_type.sourceType if self.source_type else None,
            'sourceName': self.sourceName,
            'sourceNameName': self.source_name.sourceName if self.source_name else None,
            'status': self.status,
            'statusName': self.status_rel.statusName if self.status_rel else None,
            'byUser': self.byUser,
            'userName': self.encoder.userName if self.encoder else None,
            'date': self.date,
            'productionVolume': self.productionVolume,
            'operationHours': self.operationHours,
            'serviceInterruption': self.serviceInterruption,
            'totalHoursServiceInterruption': self.totalHoursServiceInterruption,
            'electricityConsumption': self.electricityConsumption,
            'VFDFrequency': self.VFDFrequency,
            'spotFlow': self.spotFlow,
            'spotPressure': self.spotPressure,
            'timeSpotMeasurements': self.timeSpotMeasurements,
            'lineVoltage1': self.lineVoltage1,
            'lineVoltage2': self.lineVoltage2,
            'lineVoltage3': self.lineVoltage3,
            'lineCurrent1': self.lineCurrent1,
            'lineCurrent2': self.lineCurrent2,
            'lineCurrent3': self.lineCurrent3,
            'comment': self.comment,
            'isActive': self.isActive,
            'branchId': self.branchId,
            'branchName': self.branch.branchName if self.branch else None,
            'areaId': self.areaId,
            'areaName': self.area.areaName if self.area else None,
        }

class Monthly(db.Model):
    __tablename__ = 'Monthly'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    branchId = db.Column(db.Integer, db.ForeignKey('Branch.id'))
    sourceType = db.Column(db.Integer, db.ForeignKey('sourceType.id'))
    sourceName = db.Column(db.Integer)
    status = db.Column(db.Integer, db.ForeignKey('Status.id'))
    byUser = db.Column(db.Integer)
    month = db.Column(db.String(32))
    year = db.Column(db.Integer)
    productionVolume = db.Column(db.Float)
    operationHours = db.Column(db.Float)
    serviceInterruption = db.Column(db.Float)
    totalHoursServiceInterruption = db.Column(db.Float)
    electricityConsumption = db.Column(db.Float)
    electricityCost = db.Column(db.Float)
    bulkCost = db.Column(db.Float)
    bulkOuttake = db.Column(db.Float)
    bulkProvider = db.Column(db.String(128))
    WTPCost = db.Column(db.Float)
    WTPSource = db.Column(db.String(128))
    WTPVolume = db.Column(db.Float)
    disinfectionMode = db.Column(db.String(128))
    disinfectantCost = db.Column(db.Float)
    disinfectionAmount = db.Column(db.Float)
    disinfectionBrandType = db.Column(db.String(128))
    otherTreatmentCost = db.Column(db.Float)
    emergencyLitersConsumed = db.Column(db.Float)
    emergencyFuelCost = db.Column(db.Float)
    emergencyTotalHoursUsed = db.Column(db.Float)
    gensetLitersConsumed = db.Column(db.Float)
    gensetFuelCost = db.Column(db.Float)
    isActive = db.Column(db.Boolean)
    comment = db.Column(db.String(1024))

    # Relationships
    branch = db.relationship('Branch', backref='monthlies')
    source_type = db.relationship('SourceType', backref='monthlies')
    status_rel = db.relationship('Status', backref='monthlies')

class SourceType(db.Model):
    __tablename__ = 'sourceType'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    branchId = db.Column(db.Integer, db.ForeignKey('Branch.id'))
    sourceType = db.Column(db.String(64))
    isActive = db.Column(db.Boolean)

    def to_dict(self):
        return {
            'id': self.id,
            'branchId': self.branchId,
            'sourceType': self.sourceType,
            'isActive': self.isActive
        }

class SourceName(db.Model):
    __tablename__ = 'sourceName'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    branchId = db.Column(db.Integer, db.ForeignKey('Branch.id'))
    sourceTypeId = db.Column(db.Integer, db.ForeignKey('sourceType.id'))
    sourceName = db.Column(db.String(64))
    isActive = db.Column(db.Boolean)

    def to_dict(self):
        return {
            'id': self.id,
            'branchId': self.branchId,
            'sourceTypeId': self.sourceTypeId,
            'sourceName': self.sourceName,
            'isActive': self.isActive
        }

class Status(db.Model):
    __tablename__ = 'Status'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    statusName = db.Column(db.String(16))

    def to_dict(self):
        return {
            'id': self.id,
            'statusName': self.statusName
        }


class BranchSource(db.Model):
    __tablename__ = 'branchSource'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    branchId = db.Column(db.Integer, db.ForeignKey('Branch.id'))
    sourceTypeId = db.Column(db.Integer, db.ForeignKey('sourceType.id'))
    isActive = db.Column(db.Boolean, default=True)
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

class RequiredFields(db.Model):
    __tablename__ = 'RequiredFields'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    branchId = db.Column(db.Integer, db.ForeignKey('Branch.id'), nullable=False)
    fieldKey = db.Column(db.String(64), nullable=False)
    formType = db.Column(db.String(16), nullable=False)

    # Optional: relationship to Branch
    branch = db.relationship('Branch', backref='required_fields')